import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getDb, getCollection } from '../../../utils/db';
import { COLLECTIONS, Transaction } from '../../../types/accounting';

// 路由级缓存配置 - 每30秒自动重新验证
export const revalidate = 30;

// 从数据库获取真实数据
async function fetchData(): Promise<{ timestamp: number; data: string; transactionCount: number }> {
  console.log('Fetching fresh data from database...');
  try {
    const db = await getDb();
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const transactionCount = await transactionsCollection.countDocuments();
    
    return {
      timestamp: Date.now(),
      data: `数据库中当前有 ${transactionCount} 条交易记录`,
      transactionCount
    };
  } catch (error) {
    console.error('Database query failed:', error);
    return {
      timestamp: Date.now(),
      data: '数据获取失败',
      transactionCount: 0
    };
  }
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