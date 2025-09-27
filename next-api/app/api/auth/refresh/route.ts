import { NextRequest, NextResponse } from 'next/server';
import {
  verifyToken,
  generateToken,
  generateRefreshToken,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError
} from '../../../../utils/db';
import {
  RefreshTokenRequest,
  RefreshTokenResponse,
  ERROR_CODES
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: RefreshTokenRequest = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '刷新token参数错误',
        'MISSING_REFRESH_TOKEN',
        { field: 'refresh_token', message: 'Refresh token is required' }
      );
    }

    // 验证 refresh token
    const payload = verifyToken(refresh_token);
    if (!payload) {
      throw new ApiError(
        ERROR_CODES.UNAUTHORIZED,
        'refresh token无效或已过期',
        'INVALID_REFRESH_TOKEN'
      );
    }

    // 生成新的 access token
    const tokenPayload = {
      userId: payload.userId,
      openid: payload.openid
    };

    const newAccessToken = generateToken(tokenPayload);

    const refreshResponse: RefreshTokenResponse = {
      access_token: newAccessToken,
      expires_in: 7200 // 2小时
    };

    return NextResponse.json(
      successResponse('刷新成功', refreshResponse),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}