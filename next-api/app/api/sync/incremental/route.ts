import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError
} from '../../../../utils/db';
import {
  Transaction,
  Category,
  IncrementalSyncResponse,
  IncrementalSyncItem,
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
    const lastSyncTimeStr = searchParams.get('lastSyncTime');

    if (!lastSyncTimeStr) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '上次同步时间不能为空',
        'MISSING_LAST_SYNC_TIME'
      );
    }

    let lastSyncTime: Date;
    try {
      lastSyncTime = new Date(lastSyncTimeStr);
      if (isNaN(lastSyncTime.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '同步时间格式错误',
        'INVALID_SYNC_TIME_FORMAT'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    const currentSyncTime = new Date();

    // 获取交易记录的增量数据
    const transactionUpdates = await transactionsCollection
      .find({
        userId: user.userId,
        $or: [
          { createdAt: { $gt: lastSyncTime } },
          { updatedAt: { $gt: lastSyncTime } }
        ]
      })
      .sort({ updatedAt: 1 })
      .toArray();

    // 获取分类的增量数据（系统分类一般不会变化，但自定义分类可能会有变化）
    const categoryUpdates = await categoriesCollection
      .find({
        $or: [
          { createdAt: { $gt: lastSyncTime } },
          { updatedAt: { $gt: lastSyncTime } }
        ]
      })
      .sort({ updatedAt: 1 })
      .toArray();

    // 构建交易记录增量数据
    const transactionIncrements: IncrementalSyncItem[] = transactionUpdates.map(transaction => {
      let action: 'create' | 'update' | 'delete' = 'create';

      if (transaction.deletedAt) {
        action = 'delete';
      } else if (transaction.createdAt.getTime() !== transaction.updatedAt.getTime()) {
        action = 'update';
      }

      return {
        id: transaction.id,
        action,
        data: action === 'delete' ? { id: transaction.id } : transaction,
        updateTime: transaction.updatedAt.toISOString()
      };
    });

    // 构建分类增量数据
    const categoryIncrements: IncrementalSyncItem[] = categoryUpdates.map(category => {
      const action: 'create' | 'update' | 'delete' =
        category.createdAt.getTime() === category.updatedAt.getTime() ? 'create' : 'update';

      return {
        id: category.id,
        action,
        data: category,
        updateTime: category.updatedAt?.toISOString() || category.createdAt.toISOString()
      };
    });

    const response: IncrementalSyncResponse = {
      transactions: transactionIncrements,
      categories: categoryIncrements,
      syncTime: currentSyncTime.toISOString()
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