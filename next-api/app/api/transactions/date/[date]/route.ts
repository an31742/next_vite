import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  validateTransactionData,
  isValidDate,
  generateId
} from '../../../../../utils/db';
import {
  Transaction,
  TransactionWithCategory,
  Category,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/transactions/date/[date] - 获取指定日期的所有交易记录
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const { date } = params;

    // 验证日期格式
    if (!isValidDate(date)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '日期格式错误，请使用 YYYY-MM-DD 格式',
        'INVALID_DATE_FORMAT'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 获取指定日期的所有交易记录
    const transactions = await transactionsCollection
      .find({
        userId: user.userId,
        date: date,
        deletedAt: { $exists: false }
      })
      .sort({ createdAt: -1 })
      .toArray();

    // 获取分类信息
    const categoryIds = Array.from(new Set(transactions.map(t => t.categoryId)));
    const categories = await categoriesCollection
      .find({ id: { $in: categoryIds } })
      .toArray();

    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    const transactionsWithCategory: TransactionWithCategory[] = transactions.map(transaction => ({
      ...transaction,
      category: categoryMap.get(transaction.categoryId) || {
        id: transaction.categoryId,
        name: '未知分类',
        type: transaction.type,
        icon: '❓',
        color: '#999999',
        sort: 999,
        isSystem: false
      }
    }));

    // 计算当日统计
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpense += transaction.amount;
      }
      acc.count++;
      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      count: 0,
      balance: 0
    });

    summary.balance = summary.totalIncome - summary.totalExpense;

    return NextResponse.json(
      successResponse(`获取 ${date} 的交易记录成功`, {
        date,
        transactions: transactionsWithCategory,
        summary
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

// PUT /api/transactions/date/[date] - 批量更新指定日期的交易记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const { date } = params;

    // 验证日期格式
    if (!isValidDate(date)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '日期格式错误，请使用 YYYY-MM-DD 格式',
        'INVALID_DATE_FORMAT'
      );
    }

    const body = await request.json();
    const {
      transactions: updatedTransactions,
      updateType = 'modify' // 'modify' | 'replace' | 'addToDate'
    }: {
      transactions: (UpdateTransactionRequest & { id?: string })[];
      updateType?: 'modify' | 'replace' | 'addToDate';
    } = body;

    if (!updatedTransactions || !Array.isArray(updatedTransactions)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '请提供有效的交易记录数组',
        'INVALID_TRANSACTIONS_DATA'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    let results: any[] = [];

    if (updateType === 'replace') {
      // 替换模式：删除当日所有记录，然后添加新记录
      await transactionsCollection.updateMany(
        {
          userId: user.userId,
          date: date,
          deletedAt: { $exists: false }
        },
        {
          $set: {
            deletedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // 添加新记录
      for (const transactionData of updatedTransactions) {
        const validation = validateTransactionData({ ...transactionData, date });
        if (!validation.valid) {
          throw new ApiError(
            ERROR_CODES.VALIDATION_ERROR,
            `数据验证失败: ${validation.errors.join(', ')}`,
            'VALIDATION_ERROR'
          );
        }

        // 验证分类
        const category = await categoriesCollection.findOne({ id: transactionData.categoryId });
        if (!category || category.type !== transactionData.type) {
          throw new ApiError(
            ERROR_CODES.VALIDATION_ERROR,
            '分类不存在或类型不匹配',
            'INVALID_CATEGORY'
          );
        }

        const newTransaction: Omit<Transaction, '_id'> = {
          id: generateId(),
          userId: user.userId,
          type: transactionData.type!,
          amount: transactionData.amount!,
          categoryId: transactionData.categoryId!,
          note: transactionData.note || '',
          date: date,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await transactionsCollection.insertOne(newTransaction);
        results.push({ action: 'created', id: newTransaction.id });
      }

    } else if (updateType === 'addToDate') {
      // 添加到指定日期模式：在指定日期添加新记录
      for (const transactionData of updatedTransactions) {
        const validation = validateTransactionData({ ...transactionData, date });
        if (!validation.valid) {
          throw new ApiError(
            ERROR_CODES.VALIDATION_ERROR,
            `数据验证失败: ${validation.errors.join(', ')}`,
            'VALIDATION_ERROR'
          );
        }

        // 验证分类
        const category = await categoriesCollection.findOne({ id: transactionData.categoryId });
        if (!category || category.type !== transactionData.type) {
          throw new ApiError(
            ERROR_CODES.VALIDATION_ERROR,
            '分类不存在或类型不匹配',
            'INVALID_CATEGORY'
          );
        }

        const newTransaction: Omit<Transaction, '_id'> = {
          id: generateId(),
          userId: user.userId,
          type: transactionData.type!,
          amount: transactionData.amount!,
          categoryId: transactionData.categoryId!,
          note: transactionData.note || '',
          date: date,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await transactionsCollection.insertOne(newTransaction);
        results.push({ action: 'created', id: newTransaction.id });
      }

    } else {
      // 修改模式：更新现有记录
      for (const transactionData of updatedTransactions) {
        if (!transactionData.id) {
          throw new ApiError(
            ERROR_CODES.BAD_REQUEST,
            '修改模式下每条记录必须包含id',
            'MISSING_TRANSACTION_ID'
          );
        }

        // 检查记录是否存在且属于当前用户
        const existingTransaction = await transactionsCollection.findOne({
          id: transactionData.id,
          userId: user.userId,
          deletedAt: { $exists: false }
        });

        if (!existingTransaction) {
          results.push({ action: 'skipped', id: transactionData.id, reason: '记录不存在' });
          continue;
        }

        // 构建更新数据
        const updateData: any = {
          updatedAt: new Date()
        };

        if (transactionData.type !== undefined) updateData.type = transactionData.type;
        if (transactionData.amount !== undefined) updateData.amount = transactionData.amount;
        if (transactionData.categoryId !== undefined) updateData.categoryId = transactionData.categoryId;
        if (transactionData.note !== undefined) updateData.note = transactionData.note;
        if (transactionData.date !== undefined) updateData.date = transactionData.date;

        // 如果更新了分类或类型，验证分类
        if (transactionData.categoryId || transactionData.type) {
          const categoryId = transactionData.categoryId || existingTransaction.categoryId;
          const type = transactionData.type || existingTransaction.type;

          const category = await categoriesCollection.findOne({ id: categoryId });
          if (!category || category.type !== type) {
            results.push({ action: 'failed', id: transactionData.id, reason: '分类验证失败' });
            continue;
          }
        }

        await transactionsCollection.updateOne(
          { id: transactionData.id, userId: user.userId },
          { $set: updateData }
        );

        results.push({ action: 'updated', id: transactionData.id });
      }
    }

    // 获取更新后的当日记录
    const updatedDateTransactions = await transactionsCollection
      .find({
        userId: user.userId,
        date: date,
        deletedAt: { $exists: false }
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      successResponse(`${date} 的交易记录批量更新成功`, {
        updateType,
        results,
        updatedCount: updatedDateTransactions.length,
        date
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

// DELETE /api/transactions/date/[date] - 删除指定日期的所有交易记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const { date } = params;

    // 验证日期格式
    if (!isValidDate(date)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '日期格式错误，请使用 YYYY-MM-DD 格式',
        'INVALID_DATE_FORMAT'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 获取待删除的记录数量
    const countToDelete = await transactionsCollection.countDocuments({
      userId: user.userId,
      date: date,
      deletedAt: { $exists: false }
    });

    if (countToDelete === 0) {
      return NextResponse.json(
        successResponse(`${date} 没有找到可删除的交易记录`, {
          date,
          deletedCount: 0
        }),
        { status: 200 }
      );
    }

    // 软删除当日所有记录
    const deleteResult = await transactionsCollection.updateMany(
      {
        userId: user.userId,
        date: date,
        deletedAt: { $exists: false }
      },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(
      successResponse(`成功删除 ${date} 的所有交易记录`, {
        date,
        deletedCount: deleteResult.modifiedCount
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