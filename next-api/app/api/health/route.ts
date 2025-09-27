import { NextRequest, NextResponse } from 'next/server';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 检查环境变量
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      DB_NAME: !!process.env.DB_NAME,
      JWT_SECRET: !!process.env.JWT_SECRET,
      WECHAT_APP_ID: !!process.env.WECHAT_APP_ID,
      WECHAT_APP_SECRET: !!process.env.WECHAT_APP_SECRET,
      NODE_ENV: process.env.NODE_ENV
    };

    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => key !== 'NODE_ENV' && !value)
      .map(([key]) => key);

    return NextResponse.json({
      code: 200,
      message: 'Health check',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: envCheck,
        missing_variables: missingVars,
        has_all_required: missingVars.length === 0
      }
    });

  } catch (error) {
    return NextResponse.json({
      code: 500,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}