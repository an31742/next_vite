// 记账小程序类型定义

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  error?: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

// 用户相关类型
export interface User {
  id: string;
  openid: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  code: string;
  encryptedData?: string;
  iv?: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  user: Pick<User, 'id' | 'openid' | 'nickname' | 'avatar'>;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  expires_in: number;
}

// 交易记录相关类型
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  date: string; // YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface CreateTransactionRequest {
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
}

export interface UpdateTransactionRequest {
  type?: TransactionType;
  amount?: number;
  categoryId?: string;
  note?: string;
  date?: string;
}

export interface TransactionListQuery {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionListResponse {
  list: TransactionWithCategory[];
  pagination: PaginationInfo;
}

// 分类相关类型
export interface Category {
  id: string;
  type: TransactionType;
  name: string;
  icon?: string;
  color?: string;
  sort: number;
  isSystem: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryRequest {
  type: TransactionType;
  name: string;
  icon?: string;
  color?: string;
}

export interface CategoriesResponse {
  income: Category[];
  expense: Category[];
}

// 统计相关类型
export interface StatisticsSummary {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface DailyTrend {
  date: string;
  income: number;
  expense: number;
  balance?: number;
}

export interface MonthlyTrend {
  month: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface MonthlyStatisticsResponse {
  year: number;
  month: number;
  summary: StatisticsSummary;
  categoryStats: {
    income: CategoryStats[];
    expense: CategoryStats[];
  };
  dailyTrend: DailyTrend[];
}

export interface YearlyStatisticsResponse {
  year: number;
  summary: StatisticsSummary;
  monthlyTrend: MonthlyTrend[];
  categoryStats: {
    topIncomeCategories: CategoryStats[];
    topExpenseCategories: CategoryStats[];
  };
}

export interface RangeStatisticsQuery {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'month';
}

export interface RangeStatisticsResponse {
  startDate: string;
  endDate: string;
  summary: StatisticsSummary;
  trend: DailyTrend[];
  categoryBreakdown: {
    income?: CategoryStats[];
    expense?: CategoryStats[];
  };
}

// 数据同步相关类型
export interface SyncTransactionItem {
  localId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  date: string;
  createTime: string;
}

export interface BatchSyncRequest {
  transactions: SyncTransactionItem[];
}

export interface SyncResult {
  localId: string;
  serverId?: string;
  status: 'created' | 'updated' | 'failed';
  error?: string;
  code?: string;
}

export interface BatchSyncResponse {
  success: SyncResult[];
  failed: SyncResult[];
}

export interface IncrementalSyncItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  updateTime: string;
}

export interface IncrementalSyncResponse {
  transactions: IncrementalSyncItem[];
  categories: IncrementalSyncItem[];
  syncTime: string;
}

// 按日期操作相关类型
export interface DailyTransactionsResponse {
  date: string;
  transactions: TransactionWithCategory[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
  };
}

export interface BatchUpdateRequest {
  transactions: (UpdateTransactionRequest & { id?: string })[];
  updateType?: 'modify' | 'replace' | 'addToDate';
}

export interface BatchUpdateResult {
  action: 'created' | 'updated' | 'skipped' | 'failed';
  id: string;
  reason?: string;
}

export interface BatchUpdateResponse {
  updateType: string;
  results: BatchUpdateResult[];
  updatedCount: number;
  date: string;
}

// JWT 载荷类型
export interface JWTPayload {
  userId: string;
  openid: string;
  iat: number;
  exp: number;
}

// 数据库集合名称常量
export const COLLECTIONS = {
  USERS: 'users',
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  SYNC_LOGS: 'sync_logs'
} as const;

// 错误码常量
export const ERROR_CODES = {
  // 通用错误
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,

  // 业务错误
  USER_NOT_FOUND: 'B1001',
  WECHAT_LOGIN_FAILED: 'B1002',
  TRANSACTION_NOT_FOUND: 'B2001',
  CATEGORY_NOT_FOUND: 'B2002',
  INVALID_AMOUNT: 'B2003',
  INVALID_DATE: 'B2004',
  SYNC_CONFLICT: 'B3001'
} as const;

// 默认分类数据
export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt' | 'updatedAt'>[] = [
  // 收入分类
  { id: 'salary', type: 'income', name: '工资', icon: '💰', color: '#52C41A', sort: 1, isSystem: true },
  { id: 'bonus', type: 'income', name: '奖金', icon: '🎁', color: '#52C41A', sort: 2, isSystem: true },
  { id: 'investment', type: 'income', name: '投资收益', icon: '📈', color: '#52C41A', sort: 3, isSystem: true },
  { id: 'other_income', type: 'income', name: '其他收入', icon: '💵', color: '#52C41A', sort: 99, isSystem: true },

  // 支出分类
  { id: 'food', type: 'expense', name: '餐饮', icon: '🍽️', color: '#FF6B6B', sort: 1, isSystem: true },
  { id: 'transport', type: 'expense', name: '交通', icon: '🚗', color: '#FF6B6B', sort: 2, isSystem: true },
  { id: 'shopping', type: 'expense', name: '购物', icon: '🛒', color: '#FF6B6B', sort: 3, isSystem: true },
  { id: 'entertainment', type: 'expense', name: '娱乐', icon: '🎬', color: '#FF6B6B', sort: 4, isSystem: true },
  { id: 'healthcare', type: 'expense', name: '医疗', icon: '🏥', color: '#FF6B6B', sort: 5, isSystem: true },
  { id: 'education', type: 'expense', name: '教育', icon: '📚', color: '#FF6B6B', sort: 6, isSystem: true },
  { id: 'housing', type: 'expense', name: '住房', icon: '🏠', color: '#FF6B6B', sort: 7, isSystem: true },
  { id: 'utilities', type: 'expense', name: '水电费', icon: '💡', color: '#FF6B6B', sort: 8, isSystem: true },
  { id: 'other_expense', type: 'expense', name: '其他支出', icon: '💸', color: '#FF6B6B', sort: 99, isSystem: true }
];