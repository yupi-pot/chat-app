import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string
): Promise<{ url: string; fileType: 'image' | 'file' }> {
  const fileType: 'image' | 'file' = mimetype.startsWith('image/') ? 'image' : 'file'
  const resourceType = fileType === 'image' ? 'image' : 'raw'

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: resourceType, folder: 'chat-app' }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve({ url: result.secure_url, fileType })
      })
      .end(buffer)
  })
}
