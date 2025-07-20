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
