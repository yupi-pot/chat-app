import { prisma } from '../prismaClient'

export const usersService = {
  // Все пользователи кроме себя, отсортированные: онлайн сначала
  async getUsers(currentUserId: string) {
    return prisma.user.findMany({
      where: { id: { not: currentUserId } },
      select: { id: true, username: true, avatar: true, isOnline: true, createdAt: true },
      orderBy: [{ isOnline: 'desc' }, { username: 'asc' }],
    })
  },

  // Профиль конкретного пользователя
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, avatar: true, isOnline: true, createdAt: true },
    })
    if (!user) throw new Error('User not found')
    return user
  },

  // Обновить свой профиль (username и/или avatar URL)
  async updateProfile(userId: string, data: { username?: string; avatar?: string }) {
    if (data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: data.username, id: { not: userId } },
      })
      if (existing) throw new Error('Username already taken')
    }

    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, username: true, avatar: true, isOnline: true, createdAt: true },
    })
  },
}
