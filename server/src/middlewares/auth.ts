import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Токен приходит в заголовке вида: "Authorization: Bearer eyJhbGci..."
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // Берём сам токен после "Bearer "
  const token = authHeader.split(' ')[1]
  const payload = verifyAccessToken(token)

  if (!payload) {
    // Токен невалидный или протух
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  // Кладём данные пользователя в req — теперь они доступны в контроллерах
  req.user = payload
  next()
}