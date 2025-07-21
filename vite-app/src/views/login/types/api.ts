// 登录请求参数类型
export interface LoginParams {
  name: string
  password: string
}

// 登录响应类型
export interface LoginResponse {
  token?: string
  user?: {
    name: string
    [key: string]: any
  }
  code: number
  message: string
}
