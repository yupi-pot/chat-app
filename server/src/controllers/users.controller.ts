import { Request, Response } from 'express'
import { usersService } from '../services/users.service'
import { messagesService } from '../services/messages.service'

export const usersController = {
  async getUsers(req: Request, res: Response) {
    try {
      const users = await usersService.getUsers(req.user!.id)
      res.json({ users })
    } catch (error) {
      res.status(500).json({ message: 'Server error' })
    }
  },

  async getUserById(req: Request, res: Response) {
    try {
      const user = await usersService.getUserById(req.params.id as string)
      res.json({ user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      res.status(message === 'User not found' ? 404 : 500).json({ message })
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const { username, avatar } = req.body
      const user = await usersService.updateProfile(req.user!.id, { username, avatar })
      res.json({ user })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      res.status(message === 'Username already taken' ? 409 : 500).json({ message })
    }
  },

  async getDMHistory(req: Request, res: Response) {
    try {
      const cursor = req.query.cursor as string | undefined
      const result = await messagesService.getDMHistory(req.user!.id, req.params.id as string, cursor)
      res.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server error'
      res.status(message === 'User not found' ? 404 : 500).json({ message })
    }
  },

  async getUnreadCounts(req: Request, res: Response) {
    try {
      const counts = await messagesService.getUnreadCounts(req.user!.id)
      res.json({ counts })
    } catch (error) {
      res.status(500).json({ message: 'Server error' })
    }
  },
}
