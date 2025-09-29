import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  successResponse,
  handleApiError,
  ApiError,
  getDb
} from '../../../../utils/db';
import {
  User,
  Transaction,
  Category,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/system-manage/clear-database - 清空数据库
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action !== 'clear_database') {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '无效的操作类型',
        'INVALID_ACTION'
      );
    }

    const db = await getDb();

    // 获取清空前的统计信息
    const beforeStats = await Promise.all([
      db.collection(COLLECTIONS.TRANSACTIONS).countDocuments(),
      db.collection(COLLECTIONS.CATEGORIES).countDocuments(),
      db.collection(COLLECTIONS.USERS).countDocuments()
    ]);

    // 清空所有集合
    const clearResults = await Promise.all([
      db.collection(COLLECTIONS.TRANSACTIONS).deleteMany({}),
      db.collection(COLLECTIONS.CATEGORIES).deleteMany({}),
      db.collection(COLLECTIONS.USERS).deleteMany({})
    ]);

    const totalDeleted = clearResults.reduce((sum, result) => sum + result.deletedCount, 0);

    return NextResponse.json(
      successResponse('数据库已清空', {
        beforeStats: {
          transactions: beforeStats[0],
          categories: beforeStats[1],
          users: beforeStats[2]
        },
        deletedCounts: {
          transactions: clearResults[0].deletedCount,
          categories: clearResults[1].deletedCount,
          users: clearResults[2].deletedCount
        },
        totalDeleted
      }),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// GET /api/admin/system-manage/stats - 获取系统统计信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'system_stats';

    const db = await getDb();

    if (action === 'system_stats') {
      // 获取系统统计信息
      const stats = await Promise.all([
        db.collection(COLLECTIONS.TRANSACTIONS).countDocuments(),
        db.collection(COLLECTIONS.CATEGORIES).countDocuments(),
        db.collection(COLLECTIONS.USERS).countDocuments()
      ]);

      // 获取交易金额统计
      const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
      const amountStats = await transactionsCollection.aggregate([
        {
          $match: {
            deletedAt: { $exists: false }
          }
        },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      let totalIncome = 0;
      let totalExpense = 0;
      let transactionCount = 0;

      amountStats.forEach(stat => {
        if (stat._id === 'income') {
          totalIncome = stat.totalAmount;
        } else if (stat._id === 'expense') {
          totalExpense = stat.totalAmount;
        }
        transactionCount += stat.count;
      });

      return NextResponse.json(
        successResponse('获取系统统计成功', {
          collections: {
            transactions: stats[0],
            categories: stats[1],
            users: stats[2]
          },
          transactions: {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            count: transactionCount
          },
          totalRecords: stats.reduce((sum, count) => sum + count, 0)
        }),
        { status: 200 }
      );
    } else if (action === 'database_size') {
      // 获取数据库大小信息（简化版本）
      const collections = await db.listCollections().toArray();

      return NextResponse.json(
        successResponse('获取数据库信息成功', {
          collections: collections.map(c => c.name),
          databaseName: db.databaseName
        }),
        { status: 200 }
      );
    } else {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '无效的操作类型',
        'INVALID_ACTION'
      );
    }

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// PUT /api/admin/system-manage/reset-user - 重置指定用户数据
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, resetType = 'amount_only' } = body;

    if (!userId) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '用户ID不能为空',
        'MISSING_USER_ID'
      );
    }

    if (!['amount_only', 'delete_all'].includes(resetType)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '重置类型必须是 amount_only 或 delete_all',
        'INVALID_RESET_TYPE'
      );
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 检查用户是否存在
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      throw new ApiError(
        ERROR_CODES.NOT_FOUND,
        '用户不存在',
        'USER_NOT_FOUND'
      );
    }

    // 获取重置前的统计信息
    const beforeStats = await transactionsCollection.aggregate([
      {
        $match: {
          userId: userId,
          deletedAt: { $exists: false }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    let totalIncome = 0;
    let totalExpense = 0;
    let transactionCount = 0;

    beforeStats.forEach(stat => {
      if (stat._id === 'income') {
        totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        totalExpense = stat.total;
      }
      transactionCount += stat.count;
    });

    let processedCount = 0;

    if (resetType === 'amount_only') {
      // 仅将金额设置为0
      const updateResult = await transactionsCollection.updateMany(
        {
          userId: userId,
          deletedAt: { $exists: false }
        },
        {
          $set: {
            amount: 0,
            updatedAt: new Date()
          }
        }
      );
      processedCount = updateResult.modifiedCount;
    } else if (resetType === 'delete_all') {
      // 软删除所有交易记录
      const deleteResult = await transactionsCollection.updateMany(
        {
          userId: userId,
          deletedAt: { $exists: false }
        },
        {
          $set: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
      processedCount = deleteResult.modifiedCount;
    }

    // 更新用户记录的最后更新时间
    await usersCollection.updateOne(
      { id: userId },
      {
        $set: {
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(
      successResponse(`用户 ${user.nickname} 数据重置成功`, {
        userId,
        resetType,
        beforeStats: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount
        },
        processedCount,
        message: resetType === 'amount_only'
          ? `已将 ${processedCount} 条交易记录的金额重置为0`
          : `已删除 ${processedCount} 条交易记录`
      }),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// DELETE /api/admin/system-manage/user - 删除指定用户（包括所有数据）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '用户ID不能为空',
        'MISSING_USER_ID'
      );
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 检查用户是否存在
    const user = await usersCollection.findOne({ id: userId });
    if (!user) {
      throw new ApiError(
        ERROR_CODES.NOT_FOUND,
        '用户不存在',
        'USER_NOT_FOUND'
      );
    }

    // 删除用户的所有交易记录
    const deleteTransactionsResult = await transactionsCollection.deleteMany({
      userId: userId
    });

    // 删除用户
    const deleteUserResult = await usersCollection.deleteOne({
      id: userId
    });

    return NextResponse.json(
      successResponse(`用户 ${user.nickname} 已删除`, {
        userId,
        deletedTransactions: deleteTransactionsResult.deletedCount,
        message: `已删除用户及其 ${deleteTransactionsResult.deletedCount} 条交易记录`
      }),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}