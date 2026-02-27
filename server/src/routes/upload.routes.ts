import { Router, Request, Response } from 'express'
import { authMiddleware } from '../middlewares/auth'
import { upload } from '../middlewares/upload'
import { uploadToCloudinary } from '../utils/cloudinary'

const router = Router()

router.use(authMiddleware)

// POST /api/upload — загрузка файла, возвращает { url, fileType }
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Файл не передан' })
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype)
    res.json(result)
  } catch {
    res.status(500).json({ message: 'Ошибка загрузки файла' })
  }
})

export default router
