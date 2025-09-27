import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  generateId,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  validateTransactionData
} from '../../../../utils/db';
import {
  Transaction,
  Category,
  BatchSyncRequest,
  BatchSyncResponse,
  SyncResult,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const body: BatchSyncRequest = await request.json();

    if (!body.transactions || !Array.isArray(body.transactions)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '交易记录数据格式错误',
        'INVALID_TRANSACTIONS_DATA'
      );
    }

    if (body.transactions.length === 0) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '交易记录不能为空',
        'EMPTY_TRANSACTIONS'
      );
    }

    if (body.transactions.length > 100) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '单次同步交易记录不能超过100条',
        'TOO_MANY_TRANSACTIONS'
      );
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 获取所有分类，用于验证
    const categories = await categoriesCollection.find({}).toArray();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

    const success: SyncResult[] = [];
    const failed: SyncResult[] = [];

    // 逐个处理交易记录
    for (const syncItem of body.transactions) {
      try {
        // 验证数据格式
        const validation = validateTransactionData(syncItem);
        if (!validation.valid) {
          failed.push({
            localId: syncItem.localId,
            status: 'failed',
            error: '数据验证失败: ' + validation.errors.join(', '),
            code: 'VALIDATION_ERROR'
          });
          continue;
        }

        // 验证分类是否存在
        const category = categoryMap.get(syncItem.categoryId);
        if (!category) {
          failed.push({
            localId: syncItem.localId,
            status: 'failed',
            error: '分类不存在',
            code: ERROR_CODES.CATEGORY_NOT_FOUND
          });
          continue;
        }

        // 验证分类类型是否匹配
        if (category.type !== syncItem.type) {
          failed.push({
            localId: syncItem.localId,
            status: 'failed',
            error: '分类类型不匹配',
            code: 'CATEGORY_TYPE_MISMATCH'
          });
          continue;
        }

        // 检查是否已存在（基于localId或其他唯一标识）
        const serverId = generateId();

        const newTransaction: Omit<Transaction, '_id'> = {
          id: serverId,
          userId: user.userId,
          type: syncItem.type,
          amount: syncItem.amount,
          categoryId: syncItem.categoryId,
          note: syncItem.note || '',
          date: syncItem.date,
          createdAt: new Date(syncItem.createTime || Date.now()),
          updatedAt: new Date()
        };

        await transactionsCollection.insertOne(newTransaction);

        success.push({
          localId: syncItem.localId,
          serverId: serverId,
          status: 'created'
        });

      } catch (error) {
        console.error(`Failed to sync transaction ${syncItem.localId}:`, error);
        failed.push({
          localId: syncItem.localId,
          status: 'failed',
          error: '服务器内部错误',
          code: 'INTERNAL_ERROR'
        });
      }
    }

    const response: BatchSyncResponse = {
      success,
      failed
    };

    return NextResponse.json(
      successResponse('同步完成', response),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}