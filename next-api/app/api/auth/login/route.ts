import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  generateToken,
  generateRefreshToken,
  getWechatUserInfo,
  generateId,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError
} from '../../../../utils/db';
import {
  User,
  Transaction,
  LoginRequest,
  LoginResponse,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { code, encryptedData, iv } = body;

    if (!code) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '登录参数错误',
        'MISSING_CODE',
        { field: 'code', message: 'WeChat login code is required' }
      );
    }

    let wechatInfo = null;

    // 在开发环境中，允许使用测试 code
    if (process.env.NODE_ENV === 'development' && code.startsWith('test_')) {
      // 模拟微信登录，使用 code 作为 openid
      wechatInfo = {
        openid: code.replace('test_', 'test_openid_'),
        session_key: 'test_session_key'
      };
      console.log('🧪 开发环境：使用测试 code 模拟微信登录');
    } else {
      // 生产环境或开发环境使用真实 code 时，调用微信接口获取用户信息
      console.log('🚀 调用微信接口获取用户信息');
      wechatInfo = await getWechatUserInfo(code);
    }

    if (!wechatInfo) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '微信登录失败',
        ERROR_CODES.WECHAT_LOGIN_FAILED
      );
    }

    const { openid, session_key } = wechatInfo;
    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 查找或创建用户
    let user = await usersCollection.findOne({ openid });
    let isNewUser = false;

    if (!user) {
      // 创建新用户
      const newUser: Omit<User, '_id'> = {
        id: generateId(),
        openid,
        nickname: '用户' + openid.slice(-6),
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await usersCollection.insertOne(newUser);
      user = await usersCollection.findOne({ _id: insertResult.insertedId });
      isNewUser = true;

      console.log(`新用户注册: ${user!.id} (初始余额为0)`);

      // 根据项目规范，新用户登录时支出和收入必须初始化为0
      // 确保新用户没有任何交易记录，从零开始独立记账
      await transactionsCollection.deleteMany({
        userId: user!.id
      });

      console.log(`用户 ${user!.id} 的收支已初始化为0，确保从零开始记账`);
    } else {
      // 更新最后登录时间
      await usersCollection.updateOne(
        { openid },
        { $set: { updatedAt: new Date() } }
      );
    }

    // 获取用户当前的交易统计（用于返回初始状态）
    const stats = await transactionsCollection.aggregate([
      {
        $match: {
          userId: user!.id,
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

    // 生成JWT token
    const tokenPayload = {
      userId: user!.id,
      openid: user!.openid
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const loginResponse: LoginResponse = {
      access_token: accessToken,
      expires_in: 7200, // 2小时
      refresh_token: refreshToken,
      user: {
        id: user!.id,
        openid: user!.openid,
        nickname: user!.nickname,
        avatar: user!.avatar
      }
    };

    const welcomeMessage = isNewUser
      ? '登录成功！欢迎使用记账本，您的初始余额为0。'
      : `欢迎回来！您的当前余额为￥${summary.balance.toFixed(2)}。`;

    return NextResponse.json(
      successResponse(welcomeMessage, {
        ...loginResponse,
        isNewUser,
        summary
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