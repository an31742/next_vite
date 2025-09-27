import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  getDateRange,
  calculatePercentage,
  isValidDate
} from '../../../../utils/db';
import {
  Transaction,
  Category,
  RangeStatisticsQuery,
  RangeStatisticsResponse,
  StatisticsSummary,
  CategoryStats,
  DailyTrend,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') as 'day' | 'month' || 'day';

    if (!startDate || !endDate) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '开始日期和结束日期不能为空',
        'MISSING_DATE_PARAMS'
      );
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '日期格式错误',
        ERROR_CODES.INVALID_DATE
      );
    }

    if (new Date(startDate) > new Date(endDate)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '开始日期不能大于结束日期',
        'INVALID_DATE_RANGE'
      );
    }

    const { start, end } = getDateRange(startDate, endDate);

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 获取日期范围内的所有交易记录
    const transactions = await transactionsCollection
      .find({
        userId: user.userId,
        date: {
          $gte: startDate,
          $lte: endDate
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

    // 按时间分组统计趋势
    const trendMap: { [key: string]: DailyTrend } = {};

    if (groupBy === 'day') {
      // 按日统计
      transactions.forEach(t => {
        if (!trendMap[t.date]) {
          trendMap[t.date] = {
            date: t.date,
            income: 0,
            expense: 0,
            balance: 0
          };
        }

        if (t.type === 'income') {
          trendMap[t.date].income += t.amount;
        } else {
          trendMap[t.date].expense += t.amount;
        }
      });
    } else {
      // 按月统计
      transactions.forEach(t => {
        const transactionDate = new Date(t.date);
        const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}-01`;

        if (!trendMap[monthKey]) {
          trendMap[monthKey] = {
            date: monthKey,
            income: 0,
            expense: 0,
            balance: 0
          };
        }

        if (t.type === 'income') {
          trendMap[monthKey].income += t.amount;
        } else {
          trendMap[monthKey].expense += t.amount;
        }
      });
    }

    // 计算每个时间点的余额
    Object.values(trendMap).forEach(trend => {
      trend.balance = trend.income - trend.expense;
    });

    const trend = Object.values(trendMap).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

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

    const response: RangeStatisticsResponse = {
      startDate,
      endDate,
      summary,
      trend,
      categoryBreakdown: {
        income: incomeCategories.length > 0 ? incomeCategories : undefined,
        expense: expenseCategories.length > 0 ? expenseCategories : undefined
      }
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