import { registerAs } from '@nestjs/config'

export const MinioConfig = registerAs('minio', () => ({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  publicUrl: process.env.MINIO_PUBLIC_URL, // Public URL for presigned URLs (e.g., https://beeedu.vn/minio)
  buckets: {
    images: process.env.MINIO_BUCKET_IMAGES || 'images',
    videos: process.env.MINIO_BUCKET_VIDEOS || 'videos',
    audios: process.env.MINIO_BUCKET_AUDIOS || 'audios',
    documents: process.env.MINIO_BUCKET_DOCUMENTS || 'documents',
    others: process.env.MINIO_BUCKET_OTHERS || 'others',
  },
}))

export default MinioConfig
