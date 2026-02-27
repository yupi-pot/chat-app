import { Request, Response } from 'express'
import { roomsService } from '../services/rooms.service'
import { messagesService } from '../services/messages.service'
import { getIO } from '../socket'

export const roomsController = {
  async getRooms(req: Request, res: Response) {
    try {
      const rooms = await roomsService.getRooms(req.user!.id)
      res.json({ rooms })
    } catch (error) {
      res.status(500).json({ message: 'Server error' })
    }
  },

  async getRoomById(req: Request, res: Response) {
    try {
      const room = await roomsService.getRoomById(req.params.id as string, req.user!.id)
      res.json({ room })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      const status = message === 'Room not found' ? 404 : 500
      res.status(status).json({ message })
    }
  },

  async createRoom(req: Request, res: Response) {
    try {
      const { name, description } = req.body
      const room = await roomsService.createRoom(name, description, req.user!.id)
      // Оповещаем всех подключённых пользователей о новой комнате
      getIO().emit('room:new', { ...room, memberCount: 1, isMember: false })
      res.status(201).json({ room })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      const status = message.includes('already exists') ? 409 : 500
      res.status(status).json({ message })
    }
  },

  async joinRoom(req: Request, res: Response) {
    try {
      await roomsService.joinRoom(req.params.id as string, req.user!.id)
      res.json({ message: 'Joined successfully' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      const status = message === 'Room not found' ? 404 : message === 'Already a member' ? 409 : 500
      res.status(status).json({ message })
    }
  },

  async leaveRoom(req: Request, res: Response) {
    try {
      await roomsService.leaveRoom(req.params.id as string, req.user!.id)
      res.json({ message: 'Left successfully' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      const status = message === 'Room not found' ? 404 : message.includes('Cannot leave') ? 403 : 500
      res.status(status).json({ message })
    }
  },

  async getRoomMessages(req: Request, res: Response) {
    try {
      const cursor = req.query.cursor as string | undefined
      const result = await messagesService.getRoomMessages(req.params.id as string, req.user!.id, cursor)
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      const status = message === 'Not a member of this room' ? 403 : 500
      res.status(status).json({ message })
    }
  },
}
