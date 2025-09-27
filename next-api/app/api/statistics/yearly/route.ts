import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  getYearRange,
  calculatePercentage,
  formatDate
} from '../../../../utils/db';
import {
  Transaction,
  Category,
  YearlyStatisticsResponse,
  StatisticsSummary,
  CategoryStats,
  MonthlyTrend,
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

    if (year < 1900 || year > 2100) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '年份参数错误',
        'INVALID_YEAR_PARAM'
      );
    }

    const { start, end } = getYearRange(year);

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 获取该年的所有交易记录
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

    // 计算年度总览统计
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

    // 按月份统计趋势
    const monthlyStatsMap: { [month: number]: MonthlyTrend } = {};

    for (let month = 1; month <= 12; month++) {
      monthlyStatsMap[month] = {
        month,
        income: 0,
        expense: 0,
        balance: 0,
        transactionCount: 0
      };
    }

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      const month = transactionDate.getMonth() + 1;

      monthlyStatsMap[month].transactionCount += 1;

      if (t.type === 'income') {
        monthlyStatsMap[month].income += t.amount;
      } else {
        monthlyStatsMap[month].expense += t.amount;
      }
    });

    // 计算每月余额
    Object.values(monthlyStatsMap).forEach(monthStats => {
      monthStats.balance = monthStats.income - monthStats.expense;
    });

    const monthlyTrend = Object.values(monthlyStatsMap);

    // 按分类统计（取前10个）
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

    // 计算百分比并排序，取前10个
    const topIncomeCategories = Object.values(categoryStatsMap.income);
    const topExpenseCategories = Object.values(categoryStatsMap.expense);

    topIncomeCategories.forEach(stat => {
      stat.percentage = calculatePercentage(stat.amount, summary.income);
    });
    topExpenseCategories.forEach(stat => {
      stat.percentage = calculatePercentage(stat.amount, summary.expense);
    });

    topIncomeCategories.sort((a, b) => b.amount - a.amount);
    topExpenseCategories.sort((a, b) => b.amount - a.amount);

    const response: YearlyStatisticsResponse = {
      year,
      summary,
      monthlyTrend,
      categoryStats: {
        topIncomeCategories: topIncomeCategories.slice(0, 10),
        topExpenseCategories: topExpenseCategories.slice(0, 10)
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