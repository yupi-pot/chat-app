import { Router } from 'express'
import { z } from 'zod'
import { usersController } from '../controllers/users.controller'
import { authMiddleware } from '../middlewares/auth'
import { validate } from '../middlewares/validate'

const router = Router()

router.use(authMiddleware)

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .optional(),
  // avatar передаётся как URL после загрузки на Cloudinary
  avatar: z.string().url('Invalid avatar URL').optional(),
})

// GET /api/users — все пользователи (кроме себя)
router.get('/', usersController.getUsers)

// GET /api/users/unread — количество непрочитанных DM
// Важно: этот роут должен быть ДО /:id, иначе 'unread' трактуется как id
router.get('/unread', usersController.getUnreadCounts)

// GET /api/users/:id — профиль пользователя
router.get('/:id', usersController.getUserById)

// PATCH /api/users/me — обновить свой профиль
router.patch('/me', validate(updateProfileSchema), usersController.updateProfile)

// GET /api/users/:id/dm — история DM с пользователем (query: ?cursor=)
router.get('/:id/dm', usersController.getDMHistory)

export default router
