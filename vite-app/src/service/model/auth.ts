// 适配的登录API接口
import http from "@/service/http"

// 登录请求参数类型
export interface WebLoginParams {
  username: string
  password: string
}

export interface WechatLoginParams {
  code: string
  encryptedData?: string
  iv?: string
}

// 登录响应类型
export interface LoginResponse {
  code: number
  data?: {
    token: string
    user: {
      id: string
      openid: string
      nickname: string
      avatar: string
    }
    isNewUser: boolean
    summary: {
      totalIncome: number
      totalExpense: number
      balance: number
      totalCount: number
    }
  }
  message: string
  timestamp: string
}

interface ResType<T> {
  code: number
  data?: T
  msg: string
  err?: string
}

// 适配的登录API
const authApi = {
  // 网页登录（适配现有前端）
  async webLogin(params: WebLoginParams): Promise<any> {
    // 这里可以添加适配逻辑，将用户名密码转换为模拟的微信登录
    // 或者创建一个专门的网页登录接口
    return await http.post("/auth/web-login", params)
  },

  // 微信登录（与现有后端兼容）
  async wechatLogin(params: WechatLoginParams): Promise<any> {
    return await http.post("/auth/login", params)
  },

  // 刷新Token
  async refreshToken(refreshToken: string): Promise<any> {
    return await http.post("/refresh-token", { token: refreshToken })
  }
}

export default authApi