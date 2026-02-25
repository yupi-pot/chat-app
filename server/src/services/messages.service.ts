import { prisma } from '../prismaClient'

const MESSAGE_LIMIT = 50

export const messagesService = {
  // История сообщений комнаты с cursor-based пагинацией
  // cursor — id последнего полученного сообщения, грузим что было до него
  async getRoomMessages(roomId: string, userId: string, cursor?: string) {
    const membership = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId, roomId } },
    })
    if (!membership) throw new Error('Not a member of this room')

    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    const hasMore = messages.length > MESSAGE_LIMIT
    if (hasMore) messages.pop()

    return {
      messages: messages.reverse(), // возвращаем от старых к новым
      hasMore,
      nextCursor: hasMore ? messages[0].id : null,
    }
  },

  // История DM с конкретным пользователем
  async getDMHistory(userId: string, partnerId: string, cursor?: string) {
    const partner = await prisma.user.findUnique({ where: { id: partnerId } })
    if (!partner) throw new Error('User not found')

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    // Помечаем входящие как прочитанные
    await prisma.directMessage.updateMany({
      where: { senderId: partnerId, receiverId: userId, isRead: false },
      data: { isRead: true },
    })

    const hasMore = messages.length > MESSAGE_LIMIT
    if (hasMore) messages.pop()

    return {
      messages: messages.reverse(),
      hasMore,
      nextCursor: hasMore ? messages[0].id : null,
    }
  },

  // Количество непрочитанных DM от каждого пользователя
  async getUnreadCounts(userId: string) {
    const counts = await prisma.directMessage.groupBy({
      by: ['senderId'],
      where: { receiverId: userId, isRead: false },
      _count: { id: true },
    })

    return counts.map((c) => ({ senderId: c.senderId, count: c._count.id }))
  },
}
