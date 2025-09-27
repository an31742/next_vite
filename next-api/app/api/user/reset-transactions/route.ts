import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError
} from '../../../../utils/db';
import {
  Transaction,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/user/reset-transactions - 重置当前用户的所有交易记录
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 获取用户当前的交易记录数量
    const currentCount = await transactionsCollection.countDocuments({
      userId: user.userId,
      deletedAt: { $exists: false }
    });

    // 软删除当前用户的所有交易记录
    const deleteResult = await transactionsCollection.updateMany(
      {
        userId: user.userId,
        deletedAt: { $exists: false }
      },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log(`用户 ${user.userId} 的交易记录已重置，删除了 ${deleteResult.modifiedCount} 条记录`);

    return NextResponse.json(
      successResponse('用户交易记录重置成功', {
        userId: user.userId,
        deletedCount: deleteResult.modifiedCount,
        previousTotal: currentCount,
        message: '您的收支记录已清零，可以重新开始记账'
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

// GET /api/user/reset-transactions - 获取当前用户的交易统计（用于确认重置前的状态）
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 获取用户的交易统计
    const pipeline = [
      {
        $match: {
          userId: user.userId,
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
    ];

    const stats = await transactionsCollection.aggregate(pipeline).toArray();

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'income') {
        summary.totalIncome = stat.total;
        summary.incomeCount = stat.count;
      } else if (stat._id === 'expense') {
        summary.totalExpense = stat.total;
        summary.expenseCount = stat.count;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpense;
    summary.totalCount = summary.incomeCount + summary.expenseCount;

    // 获取最早和最晚的交易日期
    const dateRange = await transactionsCollection.aggregate([
      {
        $match: {
          userId: user.userId,
          deletedAt: { $exists: false }
        }
      },
      {
        $group: {
          _id: null,
          earliestDate: { $min: '$date' },
          latestDate: { $max: '$date' }
        }
      }
    ]).toArray();

    const range = dateRange.length > 0 ? dateRange[0] : null;

    return NextResponse.json(
      successResponse('获取用户交易统计成功', {
        userId: user.userId,
        summary,
        dateRange: range ? {
          earliestDate: range.earliestDate,
          latestDate: range.latestDate
        } : null,
        canReset: summary.totalCount > 0
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