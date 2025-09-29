import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import { getDb, getCollection } from '../../../utils/db';
import { COLLECTIONS, Transaction } from '../../../types/accounting';

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