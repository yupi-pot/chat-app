import { prisma } from '../prismaClient'

export const roomsService = {
  // Все комнаты с количеством участников и флагом — состоит ли текущий юзер
  async getRooms(userId: string) {
    const rooms = await prisma.room.findMany({
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: room.createdAt,
      memberCount: room._count.members,
      isMember: room.members.length > 0,
    }))
  },

  // Конкретная комната со списком участников
  async getRoomById(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true, isOnline: true },
            },
          },
        },
      },
    })

    if (!room) throw new Error('Room not found')

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: room.createdAt,
      isMember: room.members.some((m) => m.userId === userId),
      memberCount: room.members.length,
      members: room.members.map((m) => m.user),
    }
  },

  // Создать комнату — создатель автоматически вступает
  async createRoom(name: string, description: string | undefined, userId: string) {
    const existing = await prisma.room.findUnique({ where: { name } })
    if (existing) throw new Error('Room with this name already exists')

    return prisma.room.create({
      data: {
        name,
        description,
        members: { create: { userId } },
      },
    })
  },

  // Вступить в комнату
  async joinRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) throw new Error('Room not found')

    const existing = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    })
    if (existing) throw new Error('Already a member')

    await prisma.roomMember.create({ data: { userId, roomId } })
  },

  // Покинуть комнату (нельзя покинуть general)
  async leaveRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) throw new Error('Room not found')
    if (room.name === 'general') throw new Error('Cannot leave the general room')

    await prisma.roomMember.delete({
      where: { userId_roomId: { userId, roomId } },
    })
  },
}
