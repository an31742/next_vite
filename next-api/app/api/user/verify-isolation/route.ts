import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
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

// POST /api/user/verify-isolation - 验证和修复用户数据隔离
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);

    // 检查当前用户是否存在
    const userRecord = await usersCollection.findOne({
      $or: [
        { id: user.userId },
        { openid: user.openid }
      ]
    });

    if (!userRecord) {
      throw new ApiError(
        ERROR_CODES.NOT_FOUND,
        '用户记录不存在',
        'USER_NOT_FOUND'
      );
    }

    // 获取用户的所有交易记录统计
    const userTransactionStats = await transactionsCollection.aggregate([
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
    ]).toArray();

    // 检查是否有其他用户的数据泄露到当前用户
    const potentialLeakage = await transactionsCollection.countDocuments({
      userId: { $ne: user.userId },
      deletedAt: { $exists: false }
    });

    // 检查当前用户是否有错误的数据
    const currentUserWrongData = await transactionsCollection.countDocuments({
      userId: user.userId,
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: '' }
      ],
      deletedAt: { $exists: false }
    });

    const summary = {
      userId: user.userId,
      userExists: !!userRecord,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
      dataIssues: {
        potentialLeakage,
        currentUserWrongData,
        hasIssues: potentialLeakage > 0 || currentUserWrongData > 0
      }
    };

    userTransactionStats.forEach(stat => {
      if (stat._id === 'income') {
        summary.totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        summary.totalExpense = stat.total;
      }
      summary.transactionCount += stat.count;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    // 修复数据问题（如果存在）
    let fixActions = [];

    if (currentUserWrongData > 0) {
      // 修复当前用户的错误数据
      const fixResult = await transactionsCollection.updateMany(
        {
          userId: user.userId,
          $or: [
            { userId: { $exists: false } },
            { userId: null },
            { userId: '' }
          ],
          deletedAt: { $exists: false }
        },
        {
          $set: {
            userId: user.userId,
            updatedAt: new Date()
          }
        }
      );

      fixActions.push(`修复了 ${fixResult.modifiedCount} 条当前用户的错误数据`);
    }

    const isNewUser = summary.transactionCount === 0;

    // 如果是新用户，确保收支初始化为0
    if (isNewUser) {
      // 根据项目规范，新用户登录时支出和收入必须初始化为0
      await transactionsCollection.deleteMany({
        userId: user.userId
      });

      fixActions.push('新用户收支已初始化为0，确保从零开始独立记账');
    }

    const message = summary.dataIssues.hasIssues || isNewUser
      ? `数据验证完成${fixActions.length > 0 ? '，已修复问题' : ''}`
      : '数据隔离验证通过，无需修复';

    return NextResponse.json(
      successResponse(message, {
        ...summary,
        fixActions,
        isNewUser,
        verifiedAt: new Date().toISOString()
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

// GET /api/user/verify-isolation - 检查用户数据隔离状态
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);

    // 检查用户记录
    const userRecord = await usersCollection.findOne({
      $or: [
        { id: user.userId },
        { openid: user.openid }
      ]
    });

    // 获取用户统计
    const userStats = await transactionsCollection.aggregate([
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
    ]).toArray();

    // 检查数据完整性
    const dataIntegrityCheck = {
      // 检查是否有无userId的记录
      orphanRecords: await transactionsCollection.countDocuments({
        $or: [
          { userId: { $exists: false } },
          { userId: null },
          { userId: '' }
        ],
        deletedAt: { $exists: false }
      }),

      // 检查当前用户的记录数
      currentUserRecords: await transactionsCollection.countDocuments({
        userId: user.userId,
        deletedAt: { $exists: false }
      }),

      // 获取最早和最晚的交易日期
      dateRange: null
    };

    if (dataIntegrityCheck.currentUserRecords > 0) {
      const dateRangeResult = await transactionsCollection.aggregate([
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

      dataIntegrityCheck.dateRange = dateRangeResult[0] || null;
    }

    const summary = {
      userId: user.userId,
      userExists: !!userRecord,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0
    };

    userStats.forEach(stat => {
      if (stat._id === 'income') {
        summary.totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        summary.totalExpense = stat.total;
      }
      summary.transactionCount += stat.count;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    const isolationStatus = {
      isIsolated: dataIntegrityCheck.orphanRecords === 0,
      isNewUser: summary.transactionCount === 0,
      needsInitialization: !userRecord || summary.transactionCount === 0,
      hasValidData: summary.transactionCount > 0 && userRecord
    };

    return NextResponse.json(
      successResponse('用户数据隔离状态检查完成', {
        user: userRecord ? {
          id: userRecord.id,
          openid: userRecord.openid,
          nickname: userRecord.nickname,
          createdAt: userRecord.createdAt
        } : null,
        summary,
        dataIntegrityCheck,
        isolationStatus,
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