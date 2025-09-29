import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  handleApiError,
  ApiError,
  getPaginationParams,
  createPaginationInfo
} from '../../../../utils/db';
import {
  Transaction,
  TransactionWithCategory,
  Category,
  TransactionListResponse,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/user-transactions - 管理员获取指定用户的交易记录
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    // 验证管理员权限（这里简化处理，实际应用中应该有更严格的权限检查）
    // 在实际应用中，您可能需要检查用户的角色或权限
    if (!user.isAdmin) {
      throw new ApiError(
        ERROR_CODES.FORBIDDEN,
        '权限不足',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');
    if (!targetUserId) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '缺少用户ID参数',
        'MISSING_USER_ID'
      );
    }

    const query = {
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
      userId: targetUserId,
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