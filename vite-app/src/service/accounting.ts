// 记账本相关API接口
import http from '@/service/http'

// API响应类型
interface ApiResponse<T = any> {
  code: number
  data?: T
  msg: string
  err?: string
}

// 交易记录类型
export interface Transaction {
  id: string
  userId: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  note?: string
  date: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  category?: Category
}

// 分类类型
export interface Category {
  id: string
  type: 'income' | 'expense'
  name: string
  icon?: string
  color?: string
  sort: number
  isSystem: boolean
  createdAt?: string
  updatedAt?: string
}

// 统计类型
export interface StatisticsSummary {
  income: number
  expense: number
  balance: number
  transactionCount: number
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  amount: number
  count: number
  percentage: number
}

export interface DailyTrend {
  date: string
  income: number
  expense: number
  balance?: number
}

export interface MonthlyTrend {
  month: number
  income: number
  expense: number
  balance: number
  transactionCount: number
}

// 请求参数类型
export interface TransactionListQuery {
  page?: number
  pageSize?: number
  type?: 'income' | 'expense'
  categoryId?: string
  startDate?: string
  endDate?: string
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateTransactionRequest {
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  note?: string
  date: string
}

export interface UpdateTransactionRequest {
  type?: 'income' | 'expense'
  amount?: number
  categoryId?: string
  note?: string
  date?: string
}

// 响应类型
export interface TransactionListResponse {
  list: Transaction[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CategoriesResponse {
  income: Category[]
  expense: Category[]
}

export interface MonthlyStatisticsResponse {
  year: number
  month: number
  summary: StatisticsSummary
  categoryStats: {
    income: CategoryStats[]
    expense: CategoryStats[]
  }
  dailyTrend: DailyTrend[]
}

export interface DailyTransactionsResponse {
  date: string
  transactions: Transaction[]
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    count: number
  }
}

// 交易记录相关API
export const getTransactions = (params: TransactionListQuery): Promise<ApiResponse<TransactionListResponse>> => {
  return http.get('/api/transactions', { params })
}

export const getTransaction = (id: string): Promise<ApiResponse<Transaction>> => {
  return http.get(`/api/transactions/${id}`)
}

export const createTransaction = (data: CreateTransactionRequest): Promise<ApiResponse<Transaction>> => {
  return http.post('/api/transactions', data)
}

export const updateTransaction = (id: string, data: UpdateTransactionRequest): Promise<ApiResponse<Transaction>> => {
  return http.post(`/api/transactions/${id}`, { ...data, _method: 'PUT' })
}

export const deleteTransaction = (id: string): Promise<ApiResponse<void>> => {
  return http.post(`/api/transactions/${id}`, { _method: 'DELETE' })
}

// 分类相关API
export const getCategories = (): Promise<ApiResponse<CategoriesResponse>> => {
  return http.get('/api/categories')
}

export const createCategory = (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Category>> => {
  return http.post('/api/categories', data)
}

export const updateCategory = (id: string, data: Partial<Category>): Promise<ApiResponse<Category>> => {
  return http.post(`/api/categories/${id}`, { ...data, _method: 'PUT' })
}

export const deleteCategory = (id: string): Promise<ApiResponse<void>> => {
  return http.post(`/api/categories/${id}`, { _method: 'DELETE' })
}

// 统计相关API
export const getMonthlyStatistics = (year: number, month: number): Promise<ApiResponse<MonthlyStatisticsResponse>> => {
  return http.get('/api/statistics/monthly', {
    params: { year, month }
  })
}

export const getYearlyStatistics = (year: number): Promise<ApiResponse<any>> => {
  return http.get('/api/statistics/yearly', {
    params: { year }
  })
}

export const getRangeStatistics = (startDate: string, endDate: string, groupBy: 'day' | 'month' = 'day'): Promise<ApiResponse<any>> => {
  return http.get('/api/statistics/range', {
    params: { startDate, endDate, groupBy }
  })
}

// 日期相关API
export const getDailyTransactions = (date: string): Promise<ApiResponse<DailyTransactionsResponse>> => {
  return http.get(`/api/transactions/date/${date}`)
}

export const getRecentTransactions = (params: { page: number, pageSize: number }): Promise<ApiResponse<TransactionListResponse>> => {
  return http.get('/api/transactions', { params })
}

// 用户相关API
export const getUserStatistics = (): Promise<ApiResponse<StatisticsSummary>> => {
  return http.get('/api/user/statistics')
}

export const resetUserTransactions = (): Promise<ApiResponse<void>> => {
  return http.post('/api/user/reset-transactions')
}

// 管理员API
export const getUsersStats = (): Promise<ApiResponse<any>> => {
  return http.get('/api/admin/users-stats')
}

export const batchInitializeUsers = (data: any): Promise<ApiResponse<any>> => {
  return http.post('/api/admin/batch-initialize', data)
}