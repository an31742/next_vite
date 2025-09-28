import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  formatDate,
  parseDate,
  handleApiError,
  ApiError,
  successResponse,
  getUserFromRequest
} from '../../../utils/db';
import {
  COLLECTIONS,
  ERROR_CODES,
  Transaction,
  TransactionType
} from '../../../types/accounting';

// GET: 查看指定月份1号的交易记录
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }
    const { searchParams } = new URL(request.url);

    // 获取查询参数
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 验证参数
    if (year < 2020 || year > 2030) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '年份必须在2020-2030之间',
        'INVALID_YEAR'
      );
    }

    if (month < 1 || month > 12) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '月份必须在1-12之间',
        'INVALID_MONTH'
      );
    }

    // 构建月份第一天的日期
    const firstDayDate = `${year}-${String(month).padStart(2, '0')}-01`;

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 查询该日期的所有交易记录
    const transactions = await transactionsCollection
      .find({
        userId: user.userId,
        date: firstDayDate,
        deletedAt: { $exists: false }
      })
      .toArray();

    // 计算统计信息
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      count: transactions.length
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        summary.totalIncome += t.amount;
      } else {
        summary.totalExpense += t.amount;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    return NextResponse.json(
      successResponse(`查询${year}年${month}月1日交易记录成功`, {
        date: firstDayDate,
        year,
        month,
        transactions,
        summary,
        canReset: transactions.length > 0
      }),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// POST: 将指定月份1号的收入和支出设置为0
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }
    const { year, month, resetType = 'amount_only' } = await request.json();

    // 验证参数
    if (!year || !month) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '年份和月份参数是必需的',
        'MISSING_REQUIRED_PARAMS'
      );
    }

    if (year < 2020 || year > 2030) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '年份必须在2020-2030之间',
        'INVALID_YEAR'
      );
    }

    if (month < 1 || month > 12) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '月份必须在1-12之间',
        'INVALID_MONTH'
      );
    }

    // 验证重置类型
    if (!['amount_only', 'delete_all'].includes(resetType)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '重置类型必须是 amount_only 或 delete_all',
        'INVALID_RESET_TYPE'
      );
    }

    // 构建月份第一天的日期
    const firstDayDate = `${year}-${String(month).padStart(2, '0')}-01`;

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 查询该日期的所有交易记录
    const existingTransactions = await transactionsCollection
      .find({
        userId: user.userId,
        date: firstDayDate,
        deletedAt: { $exists: false }
      })
      .toArray();

    let updateResult;
    let resetSummary = {
      originalCount: existingTransactions.length,
      resetCount: 0,
      deletedCount: 0,
      originalIncome: 0,
      originalExpense: 0,
      resetType
    };

    // 计算原始金额
    existingTransactions.forEach(t => {
      if (t.type === 'income') {
        resetSummary.originalIncome += t.amount;
      } else {
        resetSummary.originalExpense += t.amount;
      }
    });

    if (resetType === 'amount_only') {
      // 方式1: 仅将金额设置为0，保留交易记录
      if (existingTransactions.length > 0) {
        updateResult = await transactionsCollection.updateMany(
          {
            userId: user.userId,
            date: firstDayDate,
            deletedAt: { $exists: false }
          },
          {
            $set: {
              amount: 0,
              updatedAt: new Date()
            }
          }
        );
        resetSummary.resetCount = updateResult.modifiedCount;
      }
    } else if (resetType === 'delete_all') {
      // 方式2: 软删除所有交易记录
      if (existingTransactions.length > 0) {
        updateResult = await transactionsCollection.updateMany(
          {
            userId: user.userId,
            date: firstDayDate,
            deletedAt: { $exists: false }
          },
          {
            $set: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        resetSummary.deletedCount = updateResult.modifiedCount;
      }
    }

    // 构建响应消息
    let message;
    if (resetSummary.originalCount === 0) {
      message = `${year}年${month}月1日没有交易记录，无需重置`;
    } else if (resetType === 'amount_only') {
      message = `成功将${year}年${month}月1日的${resetSummary.resetCount}条交易记录金额设置为0`;
    } else {
      message = `成功删除${year}年${month}月1日的${resetSummary.deletedCount}条交易记录`;
    }

    return NextResponse.json(
      successResponse(message, {
        date: firstDayDate,
        year,
        month,
        resetSummary,
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// PUT: 批量重置多个月份的1号交易记录
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }
    const { monthlyResets, resetType = 'amount_only' } = await request.json();

    // 验证参数
    if (!Array.isArray(monthlyResets) || monthlyResets.length === 0) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        'monthlyResets必须是包含年月信息的数组',
        'INVALID_MONTHLY_RESETS'
      );
    }

    // 验证重置类型
    if (!['amount_only', 'delete_all'].includes(resetType)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '重置类型必须是 amount_only 或 delete_all',
        'INVALID_RESET_TYPE'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const batchResults = [];

    // 按用户内存规范，新用户登录时支出和收入必须初始化为0
    for (const { year, month } of monthlyResets) {
      // 验证每个年月参数
      if (!year || !month || year < 2020 || year > 2030 || month < 1 || month > 12) {
        batchResults.push({
          year,
          month,
          status: 'failed',
          reason: '无效的年份或月份参数'
        });
        continue;
      }

      const firstDayDate = `${year}-${String(month).padStart(2, '0')}-01`;

      try {
        // 查询该日期的交易记录
        const existingTransactions = await transactionsCollection
          .find({
            userId: user.userId,
            date: firstDayDate,
            deletedAt: { $exists: false }
          })
          .toArray();

        if (existingTransactions.length === 0) {
          batchResults.push({
            year,
            month,
            date: firstDayDate,
            status: 'skipped',
            reason: '该日期没有交易记录'
          });
          continue;
        }

        let updateResult;
        if (resetType === 'amount_only') {
          updateResult = await transactionsCollection.updateMany(
            {
              userId: user.userId,
              date: firstDayDate,
              deletedAt: { $exists: false }
            },
            {
              $set: {
                amount: 0,
                updatedAt: new Date()
              }
            }
          );
        } else {
          updateResult = await transactionsCollection.updateMany(
            {
              userId: user.userId,
              date: firstDayDate,
              deletedAt: { $exists: false }
            },
            {
              $set: {
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            }
          );
        }

        batchResults.push({
          year,
          month,
          date: firstDayDate,
          status: 'success',
          originalCount: existingTransactions.length,
          processedCount: updateResult.modifiedCount,
          resetType
        });

      } catch (error) {
        batchResults.push({
          year,
          month,
          status: 'failed',
          reason: `处理失败: ${error.message}`
        });
      }
    }

    const successCount = batchResults.filter(r => r.status === 'success').length;
    const failedCount = batchResults.filter(r => r.status === 'failed').length;
    const skippedCount = batchResults.filter(r => r.status === 'skipped').length;

    return NextResponse.json(
      successResponse(`批量月度重置完成：成功${successCount}个，失败${failedCount}个，跳过${skippedCount}个`, {
        resetType,
        summary: {
          total: monthlyResets.length,
          success: successCount,
          failed: failedCount,
          skipped: skippedCount
        },
        results: batchResults,
        timestamp: new Date().toISOString()
      }),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}