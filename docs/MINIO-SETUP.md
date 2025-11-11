# MinIO Setup - Hướng dẫn sử dụng

## ✅ Đã hoàn thành

MinIO đã được cấu hình thành công trong dự án BEE!

## 🚀 Khởi động MinIO

MinIO đã được thêm vào Docker Compose. Để khởi động:

```bash
# Khởi động cả MySQL và MinIO
docker-compose up -d

# Hoặc chỉ khởi động MinIO
docker-compose up -d minio
```

## 🌐 Truy cập MinIO Console

- **URL**: http://localhost:9001
- **Username**: `minioadmin`
- **Password**: `minioadmin123`

**API Endpoint**: http://localhost:9000

## 📁 Cấu trúc đã tạo

### 1. Docker Configuration (`docker-compose.yml`)
```yaml
minio:
  image: minio/minio:latest
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Web Console
```

### 2. Configuration File (`src/config/minio.config.ts`)
- Cấu hình kết nối MinIO
- Định nghĩa các buckets mặc định

### 3. Service File (`src/infrastructure/services/minio.service.ts`)
MinIO service với các methods:
- `uploadFile()` - Upload file lên MinIO
- `downloadFile()` - Download file từ MinIO
- `deleteFile()` - Xoá file
- `getPublicUrl()` - Lấy URL public
- `getPresignedUrl()` - Lấy URL tạm thời (có thời hạn)
- `getPresignedUploadUrl()` - URL để upload trực tiếp
- `fileExists()` - Kiểm tra file có tồn tại
- `listFiles()` - Liệt kê files trong bucket
- `copyFile()` - Copy file
- `getFileMetadata()` - Lấy metadata

### 4. Module (`src/infrastructure/minio.module.ts`)
MinIO module đã được tích hợp vào InfrastructureModule

### 5. Environment Variables (`.env`)
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# Buckets
MINIO_BUCKET_AVATARS=avatars
MINIO_BUCKET_COURSES=courses
MINIO_BUCKET_EXAMS=exams
MINIO_BUCKET_QUESTIONS=questions
MINIO_BUCKET_DOCUMENTS=documents
MINIO_BUCKET_VIDEOS=videos
MINIO_BUCKET_TEMP=temp
```

## 🎯 Buckets tự động tạo

Khi khởi động ứng dụng, MinioService sẽ tự động tạo các buckets:
- ✅ `avatars` - Ảnh đại diện user
- ✅ `courses` - Thumbnail khóa học
- ✅ `exams` - File đề thi và đáp án
- ✅ `questions` - Hình ảnh câu hỏi
- ✅ `documents` - Tài liệu học tập
- ✅ `videos` - Video bài giảng
- ✅ `temp` - File tạm thời

## 💡 Cách sử dụng

### 1. Inject MinioService vào Controller/UseCase

```typescript
import { Injectable } from '@nestjs/common'
import { MinioService } from '@/infrastructure/services/minio.service'

@Injectable()
export class UploadMediaUseCase {
  constructor(private readonly minioService: MinioService) {}

  async execute(file: Express.Multer.File, userId: number) {
    const buckets = this.minioService.getBuckets()
    
    // Upload file
    const result = await this.minioService.uploadFile(
      buckets.avatars,
      `user-${userId}/avatar-${Date.now()}.jpg`,
      file.buffer,
      {
        'Content-Type': file.mimetype,
        'X-User-Id': userId.toString(),
      }
    )

    return result // { bucketName, objectKey, publicUrl }
  }
}
```

### 2. Tích hợp với Prisma Media Model

```typescript
async function uploadAndSaveToDatabase(
  file: Express.Multer.File,
  userId: number,
  prisma: PrismaService,
  minioService: MinioService
) {
  const buckets = minioService.getBuckets()
  
  // 1. Upload to MinIO
  const { bucketName, objectKey, publicUrl } = await minioService.uploadFile(
    buckets.documents,
    `docs/${Date.now()}-${file.originalname}`,
    file.buffer,
    { 'Content-Type': file.mimetype }
  )

  // 2. Save to Database
  const media = await prisma.media.create({
    data: {
      fileName: objectKey.split('/').pop(),
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

### 3. Upload Avatar Example

```typescript
async uploadAvatar(file: Express.Multer.File, userId: number) {
  const buckets = this.minioService.getBuckets()
  const ext = file.originalname.split('.').pop()
  const objectKey = `avatars/user-${userId}/avatar-${Date.now()}.${ext}`

  // Upload to MinIO
  const { bucketName, objectKey: key, publicUrl } = 
    await this.minioService.uploadFile(
      buckets.avatars,
      objectKey,
      file.buffer,
      { 'Content-Type': file.mimetype }
    )

  // Update user avatar in database
  const media = await this.prisma.media.create({
    data: {
      fileName: `avatar.${ext}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      type: 'IMAGE',
      status: 'READY',
      bucketName,
      objectKey: key,
      publicUrl,
      uploadedBy: userId,
    }
  })

  await this.prisma.user.update({
    where: { userId },
    data: { avatarId: media.mediaId }
  })

  return media
}
```

## 🔧 Các lệnh Docker hữu ích

```bash
# Xem logs MinIO
docker logs minio_storage

# Restart MinIO
docker-compose restart minio

# Stop MinIO
docker-compose stop minio

# Xoá container và data
docker-compose down -v
```

## 📊 Health Check

MinIO health endpoint: http://localhost:9000/minio/health/live

```bash
# Check health
curl http://localhost:9000/minio/health/live
```

## 🔐 Bảo mật Production

Khi deploy production, hãy thay đổi credentials:

```env
MINIO_ENDPOINT=minio.yourdomain.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=your-secure-access-key-here
MINIO_SECRET_KEY=your-secure-secret-key-here
```

## 🎨 MinIO Console Features

Truy cập http://localhost:9001 để:
- ✅ Xem và quản lý buckets
- ✅ Upload/download files qua UI
- ✅ Xem storage usage
- ✅ Cấu hình bucket policies
- ✅ Quản lý users và access keys

## 📦 Package đã cài đặt

```json
{
  "minio": "^8.0.0",
  "@types/minio": "^8.0.0"
}
```

## ✨ Tính năng nổi bật

1. **Tự động tạo buckets** khi khởi động app
2. **Bucket policies** tự động set cho public read
3. **Health check** tích hợp sẵn
4. **Type-safe** với TypeScript
5. **Global module** - inject ở bất kỳ đâu
6. **Presigned URLs** cho upload/download bảo mật
7. **Metadata** support đầy đủ
8. **File operations** hoàn chỉnh

## 🐛 Troubleshooting

### MinIO không khởi động được
```bash
docker-compose logs minio
```

### Port đã được sử dụng
Thay đổi port trong `docker-compose.yml`:
```yaml
ports:
  - "9010:9000"  # Thay vì 9000
  - "9011:9001"  # Thay vì 9001
```

### Connection refused
- Kiểm tra MinIO container đang chạy: `docker ps`
- Kiểm tra firewall
- Thử restart: `docker-compose restart minio`

## 📚 Tài liệu thêm

- MinIO Client SDK: https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html
- MinIO Server: https://min.io/docs/minio/linux/index.html
- Bucket Policy: https://min.io/docs/minio/linux/administration/identity-access-management/policy-based-access-control.html

---

✅ **Setup hoàn tất! MinIO sẵn sàng sử dụng.**
