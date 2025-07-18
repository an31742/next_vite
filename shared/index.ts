// 通用API响应格式
export interface ApiResponse<T> {
  data?: T
  error?: string
}

// 用户类型
export interface User {
  id: string
  email: string
  name: string
}
