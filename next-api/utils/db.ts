import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import {
  User,
  Transaction,
  Category,
  JWTPayload,
  ApiResponse,
  ERROR_CODES,
  COLLECTIONS,
  DEFAULT_CATEGORIES
} from '../types/accounting';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.DB_NAME as string;
const JWT_SECRET = process.env.JWT_SECRET || "accounting_app_secret_2024";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// 获取数据库连接
export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  if (!uri) {
    console.error('Missing MONGODB_URI environment variable');
    throw new Error('Database configuration error: Missing MONGODB_URI');
  }
  if (!dbName) {
    console.error('Missing DB_NAME environment variable');
    throw new Error('Database configuration error: Missing DB_NAME');
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(dbName);

    console.log(`Connected to MongoDB database: ${dbName}`);

    // 初始化默认分类
    await initializeDefaultCategories();

    return cachedDb;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

// 获取集合
export async function getCollection<T = any>(collectionName: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(collectionName);
}

// 初始化默认分类
async function initializeDefaultCategories() {
  try {
    const categoriesCollection = await getCollection<Category>(COLLECTIONS.CATEGORIES);
    const existingCategories = await categoriesCollection.countDocuments();

    if (existingCategories === 0) {
      const categoriesWithTimestamp = DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await categoriesCollection.insertMany(categoriesWithTimestamp);
      console.log('Default categories initialized');
    }
  } catch (error) {
    console.error('Failed to initialize default categories:', error);
  }
}

// JWT 工具函数
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// 从请求中提取用户信息
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

// 生成唯一ID
export function generateId(): string {
  return new ObjectId().toString();
}

// 格式化日期为 YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// 解析日期字符串
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

// 验证日期格式
export function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

// 验证金额格式
export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && Number.isFinite(amount);
}

// 创建API响应
export function createApiResponse<T>(
  code: number,
  message: string,
  data?: T,
  error?: string,
  details?: any
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    code,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined) response.data = data;
  if (error) response.error = error;
  if (details) response.details = details;

  return response;
}

// 创建成功响应
export function successResponse<T>(message: string, data?: T): ApiResponse<T> {
  return createApiResponse(ERROR_CODES.SUCCESS, message, data);
}

// 创建错误响应
export function errorResponse(
  code: number,
  message: string,
  error?: string,
  details?: any
): ApiResponse {
  return createApiResponse(code, message, undefined, error, details);
}

// 分页工具函数
export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
}

export function getPaginationParams(page = 1, pageSize = 20): PaginationParams {
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100);
  const skip = (validPage - 1) * validPageSize;

  return {
    page: validPage,
    pageSize: validPageSize,
    skip
  };
}

export function createPaginationInfo(
  page: number,
  pageSize: number,
  total: number
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}

// 统计工具函数
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 10000) / 100; // 保留2位小数
}

// 日期范围工具函数
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getYearRange(year: number): { start: Date; end: Date } {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export function getDateRange(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = parseDate(startDate);
  const end = new Date(parseDate(endDate).getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

// 微信小程序相关工具函数
export async function getWechatUserInfo(code: string): Promise<{ openid: string; session_key: string } | null> {
  try {
    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      console.error('Missing WeChat app credentials');
      return null;
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.errcode) {
      console.error('WeChat API error:', data);
      return null;
    }

    return {
      openid: data.openid,
      session_key: data.session_key
    };
  } catch (error) {
    console.error('Failed to get WeChat user info:', error);
    return null;
  }
}

// 数据验证工具函数
export function validateTransactionData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.push('Invalid transaction type');
  }

  if (!isValidAmount(data.amount)) {
    errors.push('Invalid amount');
  }

  if (!data.categoryId || typeof data.categoryId !== 'string') {
    errors.push('Invalid category ID');
  }

  if (!data.date || !isValidDate(data.date)) {
    errors.push('Invalid date format');
  }

  if (data.note && typeof data.note !== 'string') {
    errors.push('Invalid note format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateCategoryData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.push('Invalid category type');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Invalid category name');
  }

  if (data.icon && typeof data.icon !== 'string') {
    errors.push('Invalid icon format');
  }

  if (data.color && (typeof data.color !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(data.color))) {
    errors.push('Invalid color format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 错误处理工具函数
export class ApiError extends Error {
  constructor(
    public code: number,
    public message: string,
    public error?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): ApiResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, error.error, error.details);
  }

  console.error('Unexpected error:', error);
  return errorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    '服务器内部错误',
    'INTERNAL_ERROR'
  );
}