import { Router } from 'express'
import { z } from 'zod'
import { roomsController } from '../controllers/rooms.controller'
import { authMiddleware } from '../middlewares/auth'
import { validate } from '../middlewares/validate'

const router = Router()

// Все роуты комнат требуют авторизации
router.use(authMiddleware)

const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, hyphens and underscores'),
  description: z.string().max(200).optional(),
})

// GET /api/rooms — список всех комнат
router.get('/', roomsController.getRooms)

// POST /api/rooms — создать комнату
router.post('/', validate(createRoomSchema), roomsController.createRoom)

// GET /api/rooms/:id — информация о комнате
router.get('/:id', roomsController.getRoomById)

// POST /api/rooms/:id/join — вступить в комнату
router.post('/:id/join', roomsController.joinRoom)

// DELETE /api/rooms/:id/leave — покинуть комнату
router.delete('/:id/leave', roomsController.leaveRoom)

// GET /api/rooms/:id/messages — история сообщений (query: ?cursor=)
router.get('/:id/messages', roomsController.getRoomMessages)

export default router
