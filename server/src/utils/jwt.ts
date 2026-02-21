import jwt from 'jsonwebtoken'

// Тип payload — что будем хранить внутри токена
interface TokenPayload {
  id: string
  email: string
  username: string
}

// Генерация access token — живёт 15 минут
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: '15m',
  })
}

// Генерация refresh token — живёт 7 дней
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: '7d',
  })
}

// Верификация access token
// Возвращает payload если токен валидный, null если нет
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload
  } catch {
    return null
  }
}

// Верификация refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload
  } catch {
    return null
  }
}