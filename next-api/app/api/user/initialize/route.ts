import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  generateId
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

// POST /api/user/initialize - 初始化用户状态（确保从0开始）
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 检查用户是否已存在
    let existingUser = await usersCollection.findOne({
      $or: [
        { id: user.userId },
        { openid: user.openid }
      ]
    });

    let isNewUser = false;
    let resetTransactions = false;

    if (!existingUser) {
      // 新用户，创建用户记录
      const newUserRecord: Omit<User, '_id'> = {
        id: user.userId,
        openid: user.openid,
        nickname: `用户${user.userId.slice(-6)}`, // 使用ID后6位作为默认昵称
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await usersCollection.insertOne(newUserRecord);
      existingUser = await usersCollection.findOne({ _id: insertResult.insertedId });
      isNewUser = true;

      console.log(`新用户注册: ${user.userId} (${user.openid})`);
    } else {
      // 现有用户，检查是否需要重置
      const body = await request.json().catch(() => ({}));
      const { forceReset = false } = body;

      if (forceReset) {
        // 强制重置现有用户的交易记录
        await transactionsCollection.updateMany(
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
        resetTransactions = true;

        console.log(`用户 ${user.userId} 的交易记录已强制重置`);
      }
    }

    // 获取用户当前的交易统计
    const stats = await transactionsCollection.aggregate([
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

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      totalCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'income') {
        summary.totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        summary.totalExpense = stat.total;
      }
      summary.totalCount += stat.count;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    // 更新用户最后登录时间
    await usersCollection.updateOne(
      { id: user.userId },
      {
        $set: {
          updatedAt: new Date()
        }
      }
    );

    const message = isNewUser
      ? '欢迎使用记账本！您的初始余额为0，可以开始记录收支了。'
      : resetTransactions
      ? '您的交易记录已重置为0，可以重新开始记账。'
      : '欢迎回来！';

    return NextResponse.json(
      successResponse(message, {
        user: {
          id: existingUser.id,
          openid: existingUser.openid,
          nickname: existingUser.nickname,
          avatar: existingUser.avatar
        },
        summary,
        isNewUser,
        resetTransactions,
        initializedAt: new Date().toISOString()
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

// GET /api/user/initialize - 获取用户初始化状态
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 获取用户信息
    const userRecord = await usersCollection.findOne({
      $or: [
        { id: user.userId },
        { openid: user.openid }
      ]
    });

    const isExistingUser = !!userRecord;

    // 获取用户的交易统计
    const stats = await transactionsCollection.aggregate([
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

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      totalCount: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'income') {
        summary.totalIncome = stat.total;
      } else if (stat._id === 'expense') {
        summary.totalExpense = stat.total;
      }
      summary.totalCount += stat.count;
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    return NextResponse.json(
      successResponse('获取用户状态成功', {
        user: userRecord ? {
          id: userRecord.id,
          openid: userRecord.openid,
          nickname: userRecord.nickname,
          avatar: userRecord.avatar,
          createdAt: userRecord.createdAt
        } : null,
        summary,
        isExistingUser,
        needsInitialization: !isExistingUser
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