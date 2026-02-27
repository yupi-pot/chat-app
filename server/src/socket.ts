import { Server } from 'socket.io'
import { createServer } from 'http'
import { Express } from 'express'
import { verifyAccessToken } from './utils/jwt'
import { prisma } from './prismaClient'

let _io: Server | null = null

export function getIO(): Server {
  if (!_io) throw new Error('Socket.IO not initialized')
  return _io
}

export function initSocket(app: Express) {
  const httpServer = createServer(app)

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })

  // Авторизация через JWT при подключении
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))

    const payload = verifyAccessToken(token)
    if (!payload) return next(new Error('Unauthorized'))

    socket.data.user = payload
    next()
  })

  _io = io

  io.on('connection', async (socket) => {
    const user = socket.data.user as { id: string; username: string; email: string }

    // Помечаем онлайн
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    })

    // Личная комната для получения DM
    socket.join(`user:${user.id}`)

    // Подключаем ко всем комнатам, в которых состоит
    const memberships = await prisma.roomMember.findMany({
      where: { userId: user.id },
      select: { roomId: true },
    })
    memberships.forEach(({ roomId }) => socket.join(roomId))

    // Уведомляем остальных что пользователь онлайн
    socket.broadcast.emit('user:online', { userId: user.id })

    // ── Сообщения в комнате ──────────────────────────────────────────────────

    socket.on('message:send', async ({
      roomId, content, fileUrl, fileType,
    }: { roomId: string; content?: string; fileUrl?: string; fileType?: string }) => {
      if (!content?.trim() && !fileUrl) return

      const member = await prisma.roomMember.findUnique({
        where: { userId_roomId: { userId: user.id, roomId } },
      })
      if (!member) return

      const message = await prisma.message.create({
        data: {
          content: content?.trim() ?? null,
          fileUrl: fileUrl ?? null,
          fileType: fileType ?? null,
          userId: user.id,
          roomId,
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
        },
      })

      io.to(roomId).emit('message:new', message)
    })

    // ── Личные сообщения ─────────────────────────────────────────────────────

    socket.on('dm:send', async ({
      receiverId, content, fileUrl, fileType,
    }: { receiverId: string; content?: string; fileUrl?: string; fileType?: string }) => {
      if (!content?.trim() && !fileUrl) return

      const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
      if (!receiver) return

      const message = await prisma.directMessage.create({
        data: {
          content: content?.trim() ?? null,
          fileUrl: fileUrl ?? null,
          fileType: fileType ?? null,
          senderId: user.id,
          receiverId,
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } },
        },
      })

      // Отправляем получателю и обратно отправителю
      io.to(`user:${receiverId}`).emit('dm:new', message)
      io.to(`user:${user.id}`).emit('dm:new', message)
    })

    // ── Индикатор печатания ──────────────────────────────────────────────────

    socket.on('typing:start', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('typing:start', { roomId, userId: user.id, username: user.username })
    })

    socket.on('typing:stop', ({ roomId }: { roomId: string }) => {
      socket.to(roomId).emit('typing:stop', { roomId, userId: user.id })
    })

    socket.on('dm:typing:start', ({ receiverId }: { receiverId: string }) => {
      socket.to(`user:${receiverId}`).emit('dm:typing:start', { userId: user.id, username: user.username })
    })

    socket.on('dm:typing:stop', ({ receiverId }: { receiverId: string }) => {
      socket.to(`user:${receiverId}`).emit('dm:typing:stop', { userId: user.id })
    })

    // ── Вступление в новую комнату (после POST /api/rooms/:id/join) ──────────

    socket.on('room:join', (roomId: string) => {
      socket.join(roomId)
    })

    // ── Отключение ───────────────────────────────────────────────────────────

    socket.on('disconnect', async () => {
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: false },
      })
      socket.broadcast.emit('user:offline', { userId: user.id })
    })
  })

  return httpServer
}
