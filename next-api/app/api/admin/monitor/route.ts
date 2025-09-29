import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  successResponse,
  handleApiError,
  ApiError,
  getDb
} from '../../../../utils/db';
import {
  User,
  Transaction,
  Category,
  ERROR_CODES,
  COLLECTIONS
} from '../../../../types/accounting';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/monitor/system - 获取系统监控信息
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    const db = await getDb();

    if (action === 'overview') {
      // 系统概览信息
      const [userCount, transactionCount, categoryCount] = await Promise.all([
        db.collection(COLLECTIONS.USERS).countDocuments(),
        db.collection(COLLECTIONS.TRANSACTIONS).countDocuments(),
        db.collection(COLLECTIONS.CATEGORIES).countDocuments()
      ]);

      // 系统资源信息
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      // 数据库连接状态
      const dbStats = await db.admin().serverInfo();

      return NextResponse.json(
        successResponse('系统监控信息获取成功', {
          system: {
            uptime: Math.floor(uptime),
            memory: {
              rss: memoryUsage.rss,
              heapTotal: memoryUsage.heapTotal,
              heapUsed: memoryUsage.heapUsed,
              external: memoryUsage.external
            },
            cpu: {
              user: cpuUsage.user,
              system: cpuUsage.system
            },
            platform: os.platform(),
            arch: os.arch(),
            totalmem: os.totalmem(),
            freemem: os.freemem()
          },
          database: {
            status: 'connected',
            name: db.databaseName,
            collections: {
              users: userCount,
              transactions: transactionCount,
              categories: categoryCount
            },
            version: dbStats.version
          },
          timestamp: new Date().toISOString()
        }),
        { status: 200 }
      );
    } else if (action === 'performance') {
      // 性能监控信息
      const startTime = Date.now();

      // 测试数据库响应时间
      const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
      await usersCollection.findOne({});
      const dbResponseTime = Date.now() - startTime;

      // 获取慢查询日志（如果有）
      const slowQueries = []; // 这里可以集成实际的慢查询日志

      return NextResponse.json(
        successResponse('性能监控信息获取成功', {
          performance: {
            dbResponseTime,
            slowQueries,
            timestamp: new Date().toISOString()
          }
        }),
        { status: 200 }
      );
    } else if (action === 'users') {
      // 用户活跃度统计
      const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
      const transactionsCollection = await getCollection<Transaction>(COLLECTIONS.TRANSACTIONS);

      const users = await usersCollection.find({}).toArray();

      // 获取每个用户的最近活动时间
      const userActivity = await Promise.all(
        users.map(async (user) => {
          const latestTransaction = await transactionsCollection
            .find({ userId: user.id, deletedAt: { $exists: false } })
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

          const transactionCount = await transactionsCollection.countDocuments({
            userId: user.id,
            deletedAt: { $exists: false }
          });

          return {
            userId: user.id,
            nickname: user.nickname,
            lastActive: latestTransaction[0]?.createdAt || user.createdAt,
            transactionCount,
            isActive: transactionCount > 0
          };
        })
      );

      // 按活跃度排序
      userActivity.sort((a, b) => {
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });

      return NextResponse.json(
        successResponse('用户活跃度统计获取成功', {
          userActivity,
          totalUsers: users.length,
          activeUsers: userActivity.filter(u => u.isActive).length,
          timestamp: new Date().toISOString()
        }),
        { status: 200 }
      );
    } else {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        '无效的操作类型',
        'INVALID_ACTION'
      );
    }

  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.code
    });
  }
}

// POST /api/admin/monitor/logs - 获取系统日志
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      level = 'info',
      limit = 100,
      startTime,
      endTime
    } = body;

    // 模拟日志数据（实际项目中应该从日志文件或日志服务获取）
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: '系统启动成功',
        service: 'accounting-api'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        level: 'info',
        message: '用户登录成功',
        service: 'auth-service'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        level: 'warn',
        message: '数据库响应较慢',
        service: 'database'
      }
    ];

    // 过滤日志
    let filteredLogs = logs;

    if (startTime) {
      filteredLogs = filteredLogs.filter(log =>
        new Date(log.timestamp).getTime() >= new Date(startTime).getTime()
      );
    }

    if (endTime) {
      filteredLogs = filteredLogs.filter(log =>
        new Date(log.timestamp).getTime() <= new Date(endTime).getTime()
      );
    }

    // 按时间排序并限制数量
    filteredLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    filteredLogs = filteredLogs.slice(0, limit);

    return NextResponse.json(
      successResponse('系统日志获取成功', {
        logs: filteredLogs,
        count: filteredLogs.length,
        level,
        limit
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