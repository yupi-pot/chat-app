import { Request, Response } from 'express'
import { authService } from '../services/auth.service'

// Настройки куки — выносим в константу чтобы не дублировать
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,      // недоступна через JS
  secure: process.env.NODE_ENV === 'production', // только HTTPS в проде
  sameSite: 'strict' as const,  // защита от CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней в миллисекундах
  path: '/api/auth',   // кука отправляется только на этот путь
}

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, username, password } = req.body
      const result = await authService.register(email, username, password)

      // Refresh token — в httpOnly куку
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)

      // Access token — в JSON ответ
      res.status(201).json({
        accessToken: result.accessToken,
        user: result.user,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      res.status(400).json({ message })
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      const result = await authService.login(email, password)

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      res.status(400).json({ message })
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      // Refresh token приходит автоматически из куки
      const refreshToken = req.cookies.refreshToken

      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token' })
      }

      const result = await authService.refresh(refreshToken)

      // Обновляем куку с новым refresh token
      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS)

      res.json({ accessToken: result.accessToken })
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired refresh token' })
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken

      if (refreshToken && req.user) {
        await authService.logout(refreshToken, req.user.id)
      }

      // Очищаем куку — устанавливаем пустую с maxAge: 0
      res.clearCookie('refreshToken', { path: '/api/auth' })

      res.json({ message: 'Logged out successfully' })
    } catch (error) {
      res.status(500).json({ message: 'Logout failed' })
    }
  },

  // Получить текущего пользователя (защищённый роут)
  async me(req: Request, res: Response) {
    try {
      const user = await import('../prismaClient').then(({ prisma }) =>
        prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { id: true, email: true, username: true, avatar: true, isOnline: true, createdAt: true },
        })
      )

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      res.json({ user })
    } catch (error) {
      res.status(500).json({ message: 'Server error' })
    }
  },
}