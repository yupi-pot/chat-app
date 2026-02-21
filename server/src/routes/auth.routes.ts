import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { registerSchema, loginSchema } from './auth.schemas'

const router = Router()

// POST /api/auth/register
// validate(registerSchema) — сначала проверяем данные, потом вызываем контроллер
router.post('/register', validate(registerSchema), authController.register)

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login)

// POST /api/auth/refresh
router.post('/refresh', authController.refresh)

// POST /api/auth/logout — защищённый роут (нужен access token)
router.post('/logout', authMiddleware, authController.logout)

// GET /api/auth/me — получить свои данные
router.get('/me', authMiddleware, authController.me)

export default router