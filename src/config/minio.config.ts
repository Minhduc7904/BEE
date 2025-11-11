import { registerAs } from '@nestjs/config'

export const MinioConfig = registerAs('minio', () => ({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
  buckets: {
    avatars: process.env.MINIO_BUCKET_AVATARS || 'avatars',
    courses: process.env.MINIO_BUCKET_COURSES || 'courses',
    exams: process.env.MINIO_BUCKET_EXAMS || 'exams',
    questions: process.env.MINIO_BUCKET_QUESTIONS || 'questions',
    documents: process.env.MINIO_BUCKET_DOCUMENTS || 'documents',
    videos: process.env.MINIO_BUCKET_VIDEOS || 'videos',
    temp: process.env.MINIO_BUCKET_TEMP || 'temp',
  },
}))

export default MinioConfig
