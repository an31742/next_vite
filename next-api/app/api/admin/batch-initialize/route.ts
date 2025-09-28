import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  successResponse,
  handleApiError,
  ApiError
} from '../../../../utils/db';
import {
  User,
  Transaction,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/batch-initialize - 批量初始化所有用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      forceReset = false,           // 是否强制重置现有用户数据
      initializeType = 'amount_only', // 初始化类型：'amount_only' 或 'delete_all'
      targetUsers = 'all'           // 目标用户：'all', 'new_only', 或用户ID数组
    } = body;

    // 验证初始化类型
    if (!['amount_only', 'delete_all'].includes(initializeType)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '初始化类型必须是 amount_only 或 delete_all',
        'INVALID_INITIALIZE_TYPE'
      );
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 获取目标用户列表
    let targetUserList;
    if (targetUsers === 'all') {
      targetUserList = await usersCollection.find({}).toArray();
    } else if (targetUsers === 'new_only') {
      // 只处理没有交易记录的新用户
      const allUsers = await usersCollection.find({}).toArray();
      targetUserList = [];

      for (const user of allUsers) {
        const transactionCount = await transactionsCollection.countDocuments({
          userId: user.id,
          deletedAt: { $exists: false }
        });

        if (transactionCount === 0) {
          targetUserList.push(user);
        }
      }
    } else if (Array.isArray(targetUsers)) {
      // 指定的用户ID列表
      targetUserList = await usersCollection.find({
        id: { $in: targetUsers }
      }).toArray();
    } else {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        'targetUsers必须是 "all", "new_only" 或用户ID数组',
        'INVALID_TARGET_USERS'
      );
    }

    if (targetUserList.length === 0) {
      return NextResponse.json(
        successResponse('没有找到需要初始化的用户', {
          targetUsers,
          processedCount: 0,
          results: []
        }),
        { status: 200 }
      );
    }

    const batchResults = [];
    let successCount = 0;
    let errorCount = 0;

    // 批量处理用户初始化
    for (const user of targetUserList) {
      try {
        // 获取用户当前统计
        const currentStats = await transactionsCollection.aggregate([
          {
            $match: {
              userId: user.id,
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

        const beforeSummary = {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0
        };

        currentStats.forEach(stat => {
          if (stat._id === 'income') {
            beforeSummary.totalIncome = stat.total;
          } else if (stat._id === 'expense') {
            beforeSummary.totalExpense = stat.total;
          }
          beforeSummary.transactionCount += stat.count;
        });

        beforeSummary.balance = beforeSummary.totalIncome - beforeSummary.totalExpense;

        const isNewUser = beforeSummary.transactionCount === 0;

        // 根据条件决定是否处理
        if (!forceReset && !isNewUser) {
          batchResults.push({
            userId: user.id,
            nickname: user.nickname,
            status: 'skipped',
            reason: '用户已有数据且未强制重置',
            beforeSummary,
            afterSummary: beforeSummary
          });
          continue;
        }

        let processedCount = 0;

        if (initializeType === 'amount_only') {
          // 仅将金额设置为0，保留交易记录结构
          const updateResult = await transactionsCollection.updateMany(
            {
              userId: user.id,
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
        } else if (initializeType === 'delete_all') {
          // 根据项目规范，新用户登录时支出和收入必须初始化为0
          // 软删除所有交易记录
          const deleteResult = await transactionsCollection.updateMany(
            {
              userId: user.id,
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
          { id: user.id },
          {
            $set: {
              updatedAt: new Date()
            }
          }
        );

        const afterSummary = {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: initializeType === 'amount_only' ? beforeSummary.transactionCount : 0
        };

        batchResults.push({
          userId: user.id,
          nickname: user.nickname,
          status: 'success',
          isNewUser,
          initializeType,
          processedCount,
          beforeSummary,
          afterSummary
        });

        successCount++;

        console.log(`用户 ${user.id} (${user.nickname}) 初始化成功: ${initializeType}, 处理了 ${processedCount} 条记录`);

      } catch (error) {
        batchResults.push({
          userId: user.id,
          nickname: user.nickname,
          status: 'failed',
          error: error.message
        });
        errorCount++;

        console.error(`用户 ${user.id} 初始化失败:`, error);
      }
    }

    const summary = {
      totalUsers: targetUserList.length,
      successCount,
      errorCount,
      skippedCount: targetUserList.length - successCount - errorCount,
      initializeType,
      forceReset,
      targetUsers
    };

    const message = `批量用户初始化完成: 成功 ${successCount} 个，失败 ${errorCount} 个，跳过 ${summary.skippedCount} 个`;

    return NextResponse.json(
      successResponse(message, {
        summary,
        results: batchResults,
        processedAt: new Date().toISOString()
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

// GET /api/admin/batch-initialize - 获取批量初始化预览
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUsers = searchParams.get('targetUsers') || 'all';

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 获取目标用户列表
    let targetUserList;
    if (targetUsers === 'all') {
      targetUserList = await usersCollection.find({}).toArray();
    } else if (targetUsers === 'new_only') {
      const allUsers = await usersCollection.find({}).toArray();
      targetUserList = [];

      for (const user of allUsers) {
        const transactionCount = await transactionsCollection.countDocuments({
          userId: user.id,
          deletedAt: { $exists: false }
        });

        if (transactionCount === 0) {
          targetUserList.push(user);
        }
      }
    } else {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        'targetUsers必须是 "all" 或 "new_only"',
        'INVALID_TARGET_USERS'
      );
    }

    // 获取每个用户的详细统计
    const userPreviews = await Promise.all(
      targetUserList.map(async (user) => {
        const stats = await transactionsCollection.aggregate([
          {
            $match: {
              userId: user.id,
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

        const summary = {
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          transactionCount: 0
        };

        stats.forEach(stat => {
          if (stat._id === 'income') {
            summary.totalIncome = stat.total;
          } else if (stat._id === 'expense') {
            summary.totalExpense = stat.total;
          }
          summary.transactionCount += stat.count;
        });

        summary.balance = summary.totalIncome - summary.totalExpense;

        return {
          user: {
            id: user.id,
            nickname: user.nickname,
            createdAt: user.createdAt
          },
          summary,
          isNewUser: summary.transactionCount === 0,
          needsInitialization: summary.totalIncome !== 0 || summary.totalExpense !== 0
        };
      })
    );

    const previewSummary = {
      totalUsers: targetUserList.length,
      newUsers: userPreviews.filter(u => u.isNewUser).length,
      existingUsers: userPreviews.filter(u => !u.isNewUser).length,
      usersNeedingInitialization: userPreviews.filter(u => u.needsInitialization).length,
      targetUsers
    };

    return NextResponse.json(
      successResponse('获取批量初始化预览成功', {
        previewSummary,
        userPreviews,
        checkedAt: new Date().toISOString()
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