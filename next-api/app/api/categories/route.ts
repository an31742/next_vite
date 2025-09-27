import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getUserFromRequest,
  generateId,
  successResponse,
  errorResponse,
  handleApiError,
  ApiError,
  validateCategoryData
} from '../../../utils/db';
import {
  Category,
  CreateCategoryRequest,
  CategoriesResponse,
  TransactionType,
  ERROR_CODES,
  COLLECTIONS
} from '../../../types/accounting';

// GET /api/categories - 获取分类列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TransactionType | null;

    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    let filter: any = {};
    if (type && ['income', 'expense'].includes(type)) {
      filter.type = type;
    }

    const categories = await categoriesCollection
      .find(filter)
      .sort({ sort: 1, createdAt: 1 })
      .toArray();

    if (type) {
      // 如果指定了类型，直接返回该类型的分类列表
      return NextResponse.json(
        successResponse('获取成功', categories),
        { status: 200 }
      );
    } else {
      // 返回按类型分组的分类列表
      const response: CategoriesResponse = {
        income: categories.filter(cat => cat.type === 'income'),
        expense: categories.filter(cat => cat.type === 'expense')
      };

      return NextResponse.json(
        successResponse('获取成功', response),
        { status: 200 }
      );
    }

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// POST /api/categories - 创建自定义分类
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, '未授权访问', 'UNAUTHORIZED');
    }

    const body: CreateCategoryRequest = await request.json();

    // 验证数据
    const validation = validateCategoryData(body);
    if (!validation.valid) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        '数据验证失败',
        'VALIDATION_ERROR',
        { errors: validation.errors }
      );
    }

    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    // 检查分类名称是否已存在（相同类型下）
    const existingCategory = await categoriesCollection.findOne({
      name: body.name.trim(),
      type: body.type
    });

    if (existingCategory) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        '分类名称已存在',
        'CATEGORY_NAME_EXISTS'
      );
    }

    // 生成分类ID（基于名称）
    const categoryId = body.name.trim().toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\u4e00-\u9fff]/g, '')
      + '_' + Date.now();

    const newCategory: Omit<Category, '_id'> = {
      id: categoryId,
      type: body.type,
      name: body.name.trim(),
      icon: body.icon || (body.type === 'income' ? '💰' : '💸'),
      color: body.color || (body.type === 'income' ? '#52C41A' : '#FF6B6B'),
      sort: 99, // 自定义分类排在后面
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await categoriesCollection.insertOne(newCategory);
    const category = await categoriesCollection.findOne({ _id: insertResult.insertedId });

    return NextResponse.json(
      successResponse('创建成功', category),
      { status: 200 }
    );

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}