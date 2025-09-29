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

    console.log('=== 微信登录请求诊断 ===');
    console.log('请求时间:', new Date().toISOString());
    console.log('环境变量 NODE_ENV:', process.env.NODE_ENV || '未设置');
    console.log('收到的 code:', code ? `${code.substring(0, 10)}...` : '未提供');
    console.log('WECHAT_APP_ID 是否设置:', !!process.env.WECHAT_APP_ID);
    console.log('WECHAT_APP_SECRET 是否设置:', !!process.env.WECHAT_APP_SECRET);

    // 详细环境诊断
    if (process.env.WECHAT_APP_ID) {
      console.log('WECHAT_APP_ID 是否为测试值:', process.env.WECHAT_APP_ID.includes('your_'));
      if (!process.env.WECHAT_APP_ID.includes('your_')) {
        console.log('WECHAT_APP_ID 长度:', process.env.WECHAT_APP_ID.length);
      }
    }
    if (process.env.WECHAT_APP_SECRET) {
      console.log('WECHAT_APP_SECRET 是否为测试值:', process.env.WECHAT_APP_SECRET.includes('your_'));
    }

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
      // 添加环境变量检查日志
      if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
        console.error('❌ 微信配置缺失:', {
          appIdExists: !!process.env.WECHAT_APP_ID,
          appSecretExists: !!process.env.WECHAT_APP_SECRET
        });
        throw new ApiError(
          ERROR_CODES.INTERNAL_ERROR,
          '服务器配置错误：缺少微信配置',
          'MISSING_WECHAT_CONFIG'
        );
      } else if (process.env.WECHAT_APP_ID.includes('your_') || process.env.WECHAT_APP_SECRET.includes('your_')) {
        console.error('❌ 微信配置为测试值:', {
          appId: process.env.WECHAT_APP_ID,
          appSecret: process.env.WECHAT_APP_SECRET ? '已设置(隐藏)' : '未设置'
        });
        throw new ApiError(
          ERROR_CODES.INTERNAL_ERROR,
          '服务器配置错误：微信配置为测试值',
          'WECHAT_CONFIG_TEST_VALUE'
        );
      }

      wechatInfo = await getWechatUserInfo(code);
      console.log('微信接口返回结果:', wechatInfo ? '成功获取' : '获取失败');
      if (wechatInfo) {
        console.log('openid 长度:', wechatInfo.openid.length);
      }
    }

    if (!wechatInfo) {
      console.error('❌ 微信登录失败，无法获取用户信息');
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '微信登录失败，无法获取用户信息',
        ERROR_CODES.WECHAT_LOGIN_FAILED
      );
    }

    const { openid, session_key } = wechatInfo;
    console.log('✅ 成功获取用户 openid:', `${openid.substring(0, 10)}...`);

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
      console.log(`现有用户登录: ${user.id}`);
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
      openid: user!.openid,
      isAdmin: false // 普通用户默认不是管理员
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

    console.log('✅ 登录完成:', {
      userId: user!.id,
      isNewUser,
      balance: summary.balance
    });

    return NextResponse.json(
      successResponse(welcomeMessage, {
        ...loginResponse,
        isNewUser,
        summary
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ 登录过程中发生错误:', error);
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}