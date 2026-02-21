import bcrypt from 'bcrypt'
import { prisma } from '../prismaClient'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'

// Тип для возврата из register/login
interface AuthResult {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    username: string
    avatar: string | null
  }
}

export const authService = {
  // Регистрация
  async register(email: string, username: string, password: string): Promise<AuthResult> {
    // Проверяем что пользователь с таким email или username не существует
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      // Бросаем ошибку — контроллер её поймает
      throw new Error(
        existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken'
      )
    }

    // Хешируем пароль. Число 10 — это "cost factor" (сложность хеширования)
    // Чем выше, тем дольше считается и тем сложнее брутфорсить
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    })

    // Автоматически добавляем пользователя в комнату "general"
    const generalRoom = await prisma.room.findUnique({
      where: { name: 'general' },
    })

    if (generalRoom) {
      await prisma.roomMember.create({
        data: { userId: user.id, roomId: generalRoom.id },
      })
    }

    const tokenPayload = { id: user.id, email: user.email, username: user.username }
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Сохраняем refresh token в БД
    // Срок жизни — 7 дней от текущего момента
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    }
  },

  // Логин
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email } })

    // Важно: не говорим "пользователь не найден" или "неверный пароль" отдельно
    // Это security best practice — иначе можно перебором узнать какие email зарегистрированы
    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Обновляем статус онлайн
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true },
    })

    const tokenPayload = { id: user.id, email: user.email, username: user.username }
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    }
  },

  // Обновление access token по refresh token
  async refresh(refreshToken: string) {
    // Ищем токен в БД и проверяем что он не протух
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token')
    }

    const tokenPayload = {
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      username: tokenRecord.user.username,
    }

    const newAccessToken = generateAccessToken(tokenPayload)

    // Rotate refresh token — старый удаляем, выдаём новый
    // Это защита от replay атак: если украли старый токен, он уже не работает
    const newRefreshToken = generateRefreshToken(tokenPayload)

    await prisma.refreshToken.delete({ where: { token: refreshToken } })
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: tokenRecord.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  },

  // Логаут
  async logout(refreshToken: string, userId: string) {
    // Удаляем refresh token из БД
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken, userId },
    })

    // Ставим пользователя оффлайн
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: false },
    })
  },
}