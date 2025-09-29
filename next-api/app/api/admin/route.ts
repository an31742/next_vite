import { NextRequest, NextResponse } from 'next/server';
import {
  successResponse,
  handleApiError,
  ApiError,
  getUserFromRequest
} from '../../../utils/db';
import {
  ERROR_CODES
} from '../../../types/accounting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin - 管理员接口根路径
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(
        ERROR_CODES.UNAUTHORIZED,
        '未授权访问',
        'UNAUTHORIZED'
      );
    }

    // 这里应该验证用户是否具有管理员权限
    // 在实际应用中，您可能需要检查用户的角色或权限

    return NextResponse.json(
      successResponse('管理员接口服务正常', {
        message: '欢迎使用记账本管理系统API',
        version: '1.0.0',
        availableEndpoints: [
          '/api/admin/users-stats',
          '/api/admin/batch-initialize',
          '/api/admin/system-manage',
          '/api/admin/data-export',
          '/api/admin/monitor'
        ],
        timestamp: new Date().toISOString()
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

// POST /api/admin - 管理员操作入口
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(
        ERROR_CODES.UNAUTHORIZED,
        '未授权访问',
        'UNAUTHORIZED'
      );
    }

    const body = await request.json();
    const { action } = body;

    // 根据操作类型转发到相应的处理函数
    switch (action) {
      case 'health_check':
        return NextResponse.json(
          successResponse('系统健康检查通过', {
            status: 'healthy',
            timestamp: new Date().toISOString()
          }),
          { status: 200 }
        );

      default:
        throw new ApiError(
          ERROR_CODES.BAD_REQUEST,
          '未知的操作类型',
          'UNKNOWN_ACTION'
        );
    }

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}