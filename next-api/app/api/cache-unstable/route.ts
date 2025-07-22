import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';

// 模拟数据库查询
async function fetchData(): Promise<{ timestamp: number; data: string }> {
  console.log('Fetching fresh data...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟1秒延迟
  return {
    timestamp: Date.now(),
    data: 'This is dynamically generated data'
  };
}

// 使用unstable_cache包装数据获取函数
const getCachedData = unstable_cache(
  async () => fetchData(),
  ['test-data'], // 缓存键
  { revalidate: 30 } // 30秒后自动失效
);

export async function GET() {
  const data = await getCachedData();
  return NextResponse.json(data);
}