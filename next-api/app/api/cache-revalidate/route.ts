import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// 路由级缓存配置 - 每30秒自动重新验证
export const revalidate = 30;

// 模拟数据库查询
async function fetchData(): Promise<{ timestamp: number; data: string }> {
  console.log('Fetching fresh data...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟1秒延迟
  return {
    timestamp: Date.now(),
    data: 'This is dynamically generated data'
  };
}

export async function GET() {
  const data = await fetchData();
  return NextResponse.json(data);
}

// 添加按需重新验证的POST端点
export async function POST() {
  // 执行数据更新操作后触发重新验证
  revalidatePath('/api/cache-revalidate');
  return NextResponse.json({
    revalidated: true,
    now: Date.now()
  });
}