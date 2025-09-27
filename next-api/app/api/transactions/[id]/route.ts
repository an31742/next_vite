import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  validateTransactionData
} from '../../../../utils/db';
import {
  Transaction,
  TransactionWithCategory,
  Category,
  UpdateTransactionRequest,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

// 强制动态渲染
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/transactions/[id] - 获取交易记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const transaction = await transactionsCollection.findOne({
      id: params.id,
      userId: user.userId,
      deletedAt: { $exists: false }
    });

    if (!transaction) {
      throw new ApiError(
        ERROR_CODES.NOT_FOUND,
        '交易记录不存在',
        ERROR_CODES.TRANSACTION_NOT_FOUND
      );
    }

    // 获取分类信息
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);
    const category = await categoriesCollection.findOne({ id: transaction.categoryId });

    const transactionWithCategory: TransactionWithCategory = {
      ...transaction,
      category: category || {
        id: transaction.categoryId,
        name: '未知分类',
        type: transaction.type,
        icon: '❓',
        color: '#999999',
        sort: 999,
        isSystem: false
      }
    };

    return NextResponse.json(
      successResponse('获取成功', transactionWithCategory),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// PUT /api/transactions/[id] - 更新交易记录
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const body: UpdateTransactionRequest = await request.json();

    // 验证数据
    if (Object.keys(body).length === 0) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '更新数据不能为空',
        'EMPTY_UPDATE_DATA'
      );
    }

    // 如果有完整的交易数据，进行验证
    if (body.type && body.amount && body.categoryId && body.date) {
      const validation = validateTransactionData(body);
      if (!validation.valid) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          '数据验证失败',
          'VALIDATION_ERROR',
          { errors: validation.errors }
        );
      }
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 检查交易记录是否存在
    const existingTransaction = await transactionsCollection.findOne({
      id: params.id,
      userId: user.userId,
      deletedAt: { $exists: false }
    });

    if (!existingTransaction) {
      throw new ApiError(
        ERROR_CODES.NOT_FOUND,
        '交易记录不存在',
        ERROR_CODES.TRANSACTION_NOT_FOUND
      );
    }

    // 如果更新了分类，验证分类是否存在且类型匹配
    if (body.categoryId || body.type) {
      const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);
      const categoryId = body.categoryId || existingTransaction.categoryId;
      const type = body.type || existingTransaction.type;

      const category = await categoriesCollection.findOne({ id: categoryId });
      if (!category) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          '分类不存在',
          ERROR_CODES.CATEGORY_NOT_FOUND
        );
      }

      if (category.type !== type) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          '分类类型不匹配',
          'CATEGORY_TYPE_MISMATCH'
        );
      }
    }

    // 构建更新数据
    const updateData: any = {
      updatedAt: new Date()
    };

    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.date !== undefined) updateData.date = body.date;

    // 更新交易记录
    await transactionsCollection.updateOne(
      { id: params.id, userId: user.userId },
      { $set: updateData }
    );

    // 获取更新后的交易记录
    const updatedTransaction = await transactionsCollection.findOne({
      id: params.id,
      userId: user.userId
    });

    // 获取分类信息
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);
    const category = await categoriesCollection.findOne({
      id: updatedTransaction!.categoryId
    });

    const transactionWithCategory: TransactionWithCategory = {
      ...updatedTransaction!,
      category: category || {
        id: updatedTransaction!.categoryId,
        name: '未知分类',
        type: updatedTransaction!.type,
        icon: '❓',
        color: '#999999',
        sort: 999,
        isSystem: false
      }
    };

    return NextResponse.json(
      successResponse('更新成功', transactionWithCategory),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// DELETE /api/transactions/[id] - 删除交易记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

    // 检查交易记录是否存在
    const existingTransaction = await transactionsCollection.findOne({
      id: params.id,
      userId: user.userId,
      deletedAt: { $exists: false }
    });

    if (!existingTransaction) {
      throw new ApiError(
        ERROR_CODES.NOT_FOUND,
        '交易记录不存在',
        ERROR_CODES.TRANSACTION_NOT_FOUND
      );
    }

    // 软删除（标记为已删除）
    await transactionsCollection.updateOne(
      { id: params.id, userId: user.userId },
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(
      successResponse('删除成功', null),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}