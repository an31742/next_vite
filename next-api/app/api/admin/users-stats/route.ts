import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  successResponse,
  handleApiError
} from '../../../../utils/db';
import {
  User,
  Transaction,
  COLLECTIONS
} from '../../../../types/accounting';

export const dynamic = 'force-dynamic';

// GET - 获取所有用户统计
export async function GET() {
  try {
    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    const users = await usersCollection.find({}).toArray();

    const userStats = await Promise.all(
      users.map(async (user) => {
        const stats = await transactionsCollection.aggregate([
          { $match: { userId: user.id, deletedAt: { $exists: false } } },
          { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]).toArray();

        let income = 0, expense = 0, count = 0;
        stats.forEach(s => {
          if (s._id === 'income') income = s.total;
          if (s._id === 'expense') expense = s.total;
          count += s.count;
        });

        return {
          user: { id: user.id, nickname: user.nickname, createdAt: user.createdAt },
          summary: { income, expense, balance: income - expense, count }
        };
      })
    );

    return NextResponse.json(
      successResponse('获取统计成功', { userStats }),
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}