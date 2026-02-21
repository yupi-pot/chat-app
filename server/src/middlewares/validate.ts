import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// Функция высшего порядка — принимает схему, возвращает middleware
// Это паттерн "middleware factory"
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // safeParse не бросает исключение, а возвращает { success, data } или { success, error }
    const result = schema.safeParse(req.body)

    if (!result.success) {
      // ZodError содержит массив ошибок с путём и сообщением
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      })
    }

    // Заменяем req.body на провалидированные данные
    // (Zod автоматически убирает лишние поля и приводит типы)
    req.body = result.data
    next()
  }
}