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

    // 调用微信接口获取用户信息
    const wechatInfo = await getWechatUserInfo(code);
    if (!wechatInfo) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '微信登录失败',
        ERROR_CODES.WECHAT_LOGIN_FAILED
      );
    }

    const { openid, session_key } = wechatInfo;
    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);

    // 查找或创建用户
    let user = await usersCollection.findOne({ openid });

    if (!user) {
      // 创建新用户
      const newUser: User = {
        id: generateId(),
        openid,
        nickname: '用户' + openid.slice(-6),
        avatar: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await usersCollection.insertOne(newUser);
      user = await usersCollection.findOne({ _id: insertResult.insertedId });
    } else {
      // 更新最后登录时间
      await usersCollection.updateOne(
        { openid },
        { $set: { updatedAt: new Date() } }
      );
    }

    // 生成JWT token
    const tokenPayload = {
      userId: user.id,
      openid: user.openid
    };

    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const loginResponse: LoginResponse = {
      access_token: accessToken,
      expires_in: 7200, // 2小时
      refresh_token: refreshToken,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };

    return NextResponse.json(
      successResponse('登录成功', loginResponse),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}