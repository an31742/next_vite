import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "admin_secret_key_2025_07_20"

export interface JWTPayload {
  userId: number
  userName: string
  role: string
  loginTime: string
  iat: number
  exp: number
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function getCurrentDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hour = String(now.getHours()).padStart(2, "0")
  const minute = String(now.getMinutes()).padStart(2, "0")
  const second = String(now.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}
