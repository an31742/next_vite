import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 检查环境变量
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      WECHAT_APP_ID: process.env.WECHAT_APP_ID ?
        (process.env.WECHAT_APP_ID.includes('your_') ? 'TEST_VALUE' : 'SET') :
        'NOT_SET',
      WECHAT_APP_SECRET: process.env.WECHAT_APP_SECRET ?
        (process.env.WECHAT_APP_SECRET.includes('your_') ? 'TEST_VALUE' : 'SET') :
        'NOT_SET',
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT_SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
    };

    const isProductionReady = process.env.NODE_ENV === 'production' &&
                             process.env.WECHAT_APP_ID &&
                             process.env.WECHAT_APP_SECRET &&
                             !process.env.WECHAT_APP_ID.includes('your_') &&
                             !process.env.WECHAT_APP_SECRET.includes('your_');

    // 添加详细的诊断信息
    const diagnosis = {
      hasRealWechatConfig: !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET &&
                             !process.env.WECHAT_APP_ID.includes('your_') &&
                             !process.env.WECHAT_APP_SECRET.includes('your_')),
      appIdPreview: process.env.WECHAT_APP_ID ?
                   (process.env.WECHAT_APP_ID.includes('your_') ? process.env.WECHAT_APP_ID : 'REAL_VALUE_SET') :
                   'NOT_SET',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
    };

    return NextResponse.json({
      code: 200,
      message: 'Environment check completed',
      data: {
        envInfo,
        isProductionReady,
        diagnosis,
        issues: []
      }
    });
  } catch (error) {
    return NextResponse.json({
      code: 500,
      message: 'Failed to check environment',
      error: error.message
    }, { status: 500 });
  }
}