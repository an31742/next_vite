import { jwtDecode } from "jwt-decode"
export interface JwtPayload {
  exp?: number
  iat?: number
  roles?: string[]
  [key: string]: any
}

/**
 * 校验 JWT 是否包含指定角色
 * @param token JWT 字符串
 * @param roles 需要校验的角色（支持单个或数组）
 * @returns boolean
 */
export function hasRole(token: string, roles: string | string[]): boolean {
  console.log("token", token)
  console.log("roles", roles)
  if (!token) return false
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const userRoles = decoded.role || []
    if (typeof roles === "string") {
      return userRoles.includes(roles)
    }
    return roles.some((role) => userRoles.includes(role))
  } catch (e) {
    return false
  }
}
