import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  getMonthRange,
  calculatePercentage,
  formatDate
} from '../../../../utils/db';
import {
  Transaction,
  Category,
  MonthlyStatisticsResponse,
  StatisticsSummary,
  CategoryStats,
  DailyTrend,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    if (year < 1900 || year > 2100 || month < 1 || month > 12) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '日期参数错误',
        'INVALID_DATE_PARAMS'
      );
    }

    const { start, end } = getMonthRange(year, month);

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 获取该月的所有交易记录
    const transactions = await transactionsCollection
      .find({
        userId: user.userId,
        date: {
          $gte: formatDate(start),
          $lte: formatDate(end)
        },
        deletedAt: { $exists: false }
      })
      .toArray();

    // 计算总览统计
    const summary: StatisticsSummary = {
      income: 0,
      expense: 0,
      balance: 0,
      transactionCount: transactions.length
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        summary.income += t.amount;
      } else {
        summary.expense += t.amount;
      }
    });
    summary.balance = summary.income - summary.expense;

    // 获取所有相关分类
    const categoryIds = Array.from(new Set(transactions.map(t => t.categoryId)));
    const categories = await categoriesCollection
      .find({ id: { $in: categoryIds } })
      .toArray();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    // 按分类统计
    const categoryStatsMap: { [key: string]: { [categoryId: string]: CategoryStats } } = {
      income: {},
      expense: {}
    };

    transactions.forEach(t => {
      const category = categoryMap.get(t.categoryId);
      const categoryName = category?.name || '未知分类';

      if (!categoryStatsMap[t.type][t.categoryId]) {
        categoryStatsMap[t.type][t.categoryId] = {
          categoryId: t.categoryId,
          categoryName,
          amount: 0,
          count: 0,
          percentage: 0
        };
      }

      categoryStatsMap[t.type][t.categoryId].amount += t.amount;
      categoryStatsMap[t.type][t.categoryId].count += 1;
    });

    // 计算百分比并排序
    const incomeCategories = Object.values(categoryStatsMap.income);
    const expenseCategories = Object.values(categoryStatsMap.expense);

    incomeCategories.forEach(stat => {
      stat.percentage = calculatePercentage(stat.amount, summary.income);
    });
    expenseCategories.forEach(stat => {
      stat.percentage = calculatePercentage(stat.amount, summary.expense);
    });

    incomeCategories.sort((a, b) => b.amount - a.amount);
    expenseCategories.sort((a, b) => b.amount - a.amount);

    // 按日期统计趋势
    const dailyStatsMap: { [date: string]: DailyTrend } = {};

    transactions.forEach(t => {
      if (!dailyStatsMap[t.date]) {
        dailyStatsMap[t.date] = {
          date: t.date,
          income: 0,
          expense: 0
        };
      }

      if (t.type === 'income') {
        dailyStatsMap[t.date].income += t.amount;
      } else {
        dailyStatsMap[t.date].expense += t.amount;
      }
    });

    const dailyTrend = Object.values(dailyStatsMap).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const response: MonthlyStatisticsResponse = {
      year,
      month,
      summary,
      categoryStats: {
        income: incomeCategories,
        expense: expenseCategories
      },
      dailyTrend
    };

    return NextResponse.json(
      successResponse('获取成功', response),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}