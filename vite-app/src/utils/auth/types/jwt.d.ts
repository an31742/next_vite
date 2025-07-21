interface JWTOptions {
  userId: number
  name: string
  loginTime: string
  role?: string[]
  roles?: string[]
}

interface JWTSignOptions {
  expiresIn: string
}

export { JWTOptions, JWTSignOptions }
