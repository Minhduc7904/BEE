# MinIO Configuration Guide

## 1. Khởi động MinIO bằng Docker Compose

```bash
docker-compose up -d minio
```

## 2. Truy cập MinIO Console

- **Console URL**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin123

## 3. Cấu trúc Buckets

MinIO service sẽ tự động tạo các buckets sau khi khởi động:

- `avatars` - Ảnh đại diện người dùng
- `courses` - Thumbnail và media của khóa học
- `exams` - File đề thi và lời giải
- `questions` - Hình ảnh câu hỏi và đáp án
- `documents` - Tài liệu học tập
- `videos` - Video bài giảng
- `temp` - File tạm thời

## 4. Sử dụng MinioService

### Inject service vào controller/use-case:

```typescript
import { Injectable } from '@nestjs/common'
import { MinioService } from '@/infrastructure/services/minio.service'

@Injectable()
export class UploadUseCase {
  constructor(private readonly minioService: MinioService) {}

  async uploadAvatar(file: Express.Multer.File, userId: number) {
    const buckets = this.minioService.getBuckets()
    const objectKey = `user-${userId}/avatar-${Date.now()}.${file.originalname.split('.').pop()}`

    const result = await this.minioService.uploadFile(
      buckets.avatars,
      objectKey,
      file.buffer,
      {
        'Content-Type': file.mimetype,
        'X-User-Id': userId.toString(),
      }
    )

    return result
  }
}
```

## 5. API Methods

### Upload File
```typescript
await minioService.uploadFile(bucketName, objectKey, buffer, metadata)
```

### Download File
```typescript
const buffer = await minioService.downloadFile(bucketName, objectKey)
```

### Delete File
```typescript
await minioService.deleteFile(bucketName, objectKey)
```

### Get Public URL
```typescript
const url = await minioService.getPublicUrl(bucketName, objectKey)
```

### Get Presigned URL (temporary download link)
```typescript
const url = await minioService.getPresignedUrl(bucketName, objectKey, 3600)
```

### Check File Exists
```typescript
const exists = await minioService.fileExists(bucketName, objectKey)
```

### List Files
```typescript
const files = await minioService.listFiles(bucketName, 'prefix/', true)
```

## 6. Environment Variables

Thêm vào `.env`:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

## 7. Production Deployment

Khi deploy production:

1. Thay đổi credentials:
```env
MINIO_ACCESS_KEY=your-secure-access-key
MINIO_SECRET_KEY=your-secure-secret-key
```

2. Enable SSL:
```env
MINIO_USE_SSL=true
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=443
```

3. Cấu hình reverse proxy (Nginx) cho MinIO

## 8. Tích hợp với Prisma Media Model

```typescript
import { PrismaService } from '@/prisma/prisma.service'
import { MinioService } from '@/infrastructure/services/minio.service'

async function uploadAndSaveMedia(file: Express.Multer.File, userId: number) {
  const buckets = minioService.getBuckets()
  
  // Upload to MinIO
  const { bucketName, objectKey, publicUrl } = await minioService.uploadFile(
    buckets.documents,
    `doc-${Date.now()}.pdf`,
    file.buffer,
    { 'Content-Type': 'application/pdf' }
  )

  // Save to database
  const media = await prisma.media.create({
    data: {
      fileName: `doc-${Date.now()}.pdf`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      type: 'DOCUMENT',
      status: 'READY',
      bucketName,
      objectKey,
      publicUrl,
      uploadedBy: userId,
    }
  })

  return media
}
```

## 9. Health Check

MinIO có health endpoint: `http://localhost:9000/minio/health/live`

Docker Compose đã cấu hình healthcheck tự động.

## 10. Troubleshooting

### Lỗi kết nối:
- Kiểm tra MinIO container đang chạy: `docker ps`
- Kiểm tra logs: `docker logs minio_storage`

### Lỗi bucket không tồn tại:
- Service tự động tạo buckets khi khởi động
- Kiểm tra logs: Application logs sẽ hiển thị "Bucket created: {name}"

### Lỗi permission:
- Kiểm tra bucket policy đã được set đúng
- MinIO Console > Buckets > Select bucket > Access Policy
