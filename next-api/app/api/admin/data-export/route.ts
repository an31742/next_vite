import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  successResponse,
  handleApiError,
  ApiError
} from '../../../../utils/db';
import {
  User,
  Transaction,
  Category,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/data-export - 导出系统数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get('type') || 'all';
    const format = searchParams.get('format') || 'json';

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);

    let exportData: any = {};

    if (exportType === 'all' || exportType === 'users') {
      // 导出用户数据
      exportData.users = await usersCollection.find({}).toArray();
    }

    if (exportType === 'all' || exportType === 'transactions') {
      // 导出交易数据
      exportData.transactions = await transactionsCollection.find({}).toArray();
    }

    if (exportType === 'all' || exportType === 'categories') {
      // 导出分类数据
      exportData.categories = await categoriesCollection.find({}).toArray();
    }

    if (exportType === 'all' || exportType === 'statistics') {
      // 导出统计信息
      const userStats = await usersCollection.find({}).toArray();

      const transactionStats = await transactionsCollection.aggregate([
        {
          $match: {
            deletedAt: { $exists: false }
          }
        },
        {
          $group: {
            _id: {
              userId: '$userId',
              type: '$type'
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.userId',
            stats: {
              $push: {
                type: '$_id.type',
                totalAmount: '$totalAmount',
                count: '$count'
              }
            }
          }
        }
      ]).toArray();

      // 合并用户和统计信息
      exportData.statistics = userStats.map(user => {
        const userStat = transactionStats.find(stat => stat._id === user.id);
        return {
          user: {
            id: user.id,
            nickname: user.nickname,
            createdAt: user.createdAt
          },
          transactions: userStat ? userStat.stats : []
        };
      });
    }

    // 根据格式返回数据
    if (format === 'json') {
      return NextResponse.json(
        successResponse('数据导出成功', {
          data: exportData,
          exportType,
          format,
          exportedAt: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            'Content-Disposition': 'attachment; filename="accounting-export.json"'
          }
        }
      );
    } else {
      // 默认返回JSON格式
      return NextResponse.json(
        successResponse('数据导出成功', {
          data: exportData,
          exportType,
          format,
          exportedAt: new Date().toISOString()
        }),
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

// POST /api/admin/data-export/query - 自定义查询导出
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collection, query, format = 'json' } = body;

    if (!collection) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '集合名称不能为空',
        'MISSING_COLLECTION'
      );
    }

    // 验证集合名称
    const validCollections = [
      COLLECTIONS.USERS,
      COLLECTIONS.TRANSACTIONS,
      COLLECTIONS.CATEGORIES
    ];

    if (!validCollections.includes(collection as any)) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '无效的集合名称',
        'INVALID_COLLECTION'
      );
    }

    const targetCollection = await getCollection<any>(collection);

    // 执行查询
    let result;
    if (query) {
      result = await targetCollection.find(query).toArray();
    } else {
      result = await targetCollection.find({}).toArray();
    }

    return NextResponse.json(
      successResponse(`集合 ${collection} 数据查询成功`, {
        collection,
        query,
        count: result.length,
        data: result,
        format,
        exportedAt: new Date().toISOString()
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