import { jwtDecode } from "jwt-decode"
import type { JWTOptions } from "./types/jwt"

export const decodeJWTToken = (token: string): JWTOptions => {
  try {
    return jwtDecode<JWTOptions>(token)
  } catch (error) {
    console.error("Token解析失败:", error)
    throw new Error("Token无效")
  }
}
