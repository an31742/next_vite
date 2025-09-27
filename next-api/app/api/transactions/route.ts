import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  generateId,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  validateTransactionData,
  getPaginationParams,
  createPaginationInfo,
  parseDate,
  formatDate
} from '../../../utils/db';
import {
  Transaction,
  TransactionWithCategory,
  Category,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionListQuery,
  TransactionListResponse,
  ERROR_CODES,
  COLLECTIONS
} from '../../../types/accounting';

// GET /api/transactions - 获取交易记录列表
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const { searchParams } = new URL(request.url);
    const query: TransactionListQuery = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      type: searchParams.get('type') as any,
      categoryId: searchParams.get('categoryId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      keyword: searchParams.get('keyword') || undefined
    };

    const { page, pageSize, skip } = getPaginationParams(query.page, query.pageSize);

    // 构建查询条件
    const filter: any = {
      userId: user.userId,
      deletedAt: { $exists: false }
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.date.$lte = query.endDate;
      }
    }

    if (query.keyword) {
      filter.note = { $regex: query.keyword, $options: 'i' };
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 获取总数
    const total = await transactionsCollection.countDocuments(filter);

    // 获取交易列表
    const transactions = await transactionsCollection
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    // 获取分类信息并组合数据
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

    const response: TransactionListResponse = {
      list: transactionsWithCategory,
      pagination: createPaginationInfo(page, pageSize, total)
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

// POST /api/transactions - 创建交易记录
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const body: CreateTransactionRequest = await request.json();

    // 验证数据
    const validation = validateTransactionData(body);
    if (!validation.valid) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        '数据验证失败',
        'VALIDATION_ERROR',
        { errors: validation.errors }
      );
    }

    // 验证分类是否存在
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);
    const category = await categoriesCollection.findOne({ id: body.categoryId });
    if (!category) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        '分类不存在',
        ERROR_CODES.CATEGORY_NOT_FOUND
      );
    }

    // 验证分类类型是否匹配
    if (category.type !== body.type) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        '分类类型不匹配',
        'CATEGORY_TYPE_MISMATCH'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    const newTransaction: Omit<Transaction, '_id'> = {
      id: generateId(),
      userId: user.userId,
      type: body.type,
      amount: body.amount,
      categoryId: body.categoryId,
      note: body.note || '',
      date: body.date,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await transactionsCollection.insertOne(newTransaction);
    const transaction = await transactionsCollection.findOne({ _id: insertResult.insertedId });

    const transactionWithCategory: TransactionWithCategory = {
      ...transaction!,
      category
    };

    return NextResponse.json(
      successResponse('创建成功', transactionWithCategory),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}