# ✅ MinIO Integration - Hoàn tất

## 🎉 Tóm tắt những gì đã làm

### 1. ✅ Docker Configuration
**File**: `docker-compose.yml`
- Thêm MinIO service với image `minio/minio:latest`
- Cổng 9000 (API) và 9001 (Web Console)
- Auto-restart và health check
- Volume `minio_data` để lưu trữ

### 2. ✅ Configuration
**File**: `src/config/minio.config.ts`
- MinIO connection config
- 7 buckets mặc định: avatars, courses, exams, questions, documents, videos, temp
- Environment variables support

**File**: `.env` (đã thêm)
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

### 3. ✅ MinIO Service
**File**: `src/infrastructure/services/minio.service.ts`

Các methods chính:
- `uploadFile()` - Upload file
- `downloadFile()` - Download file  
- `deleteFile()` - Xóa file
- `getPublicUrl()` - URL public
- `getPresignedUrl()` - URL tạm thời
- `fileExists()` - Kiểm tra file tồn tại
- `listFiles()` - List files
- `copyFile()` - Copy file
- `getFileMetadata()` - Lấy metadata

**Tự động tạo buckets** khi khởi động!

### 4. ✅ MinIO Module
**File**: `src/infrastructure/minio.module.ts`
- Global module
- Đã tích hợp vào `InfrastructureModule`

### 5. ✅ Example Controller
**File**: `src/presentation/controllers/media-upload.controller.ts`

API Endpoints:
- `POST /api/media/upload` - Upload file
- `GET /api/media/download/:bucket/:objectKey` - Download file
- `DELETE /api/media/:bucket/:objectKey` - Delete file
- `GET /api/media/url/:bucket/:objectKey` - Get public URL
- `GET /api/media/presigned/:bucket/:objectKey` - Get presigned URL
- `GET /api/media/list/:bucket` - List files in bucket
- `GET /api/media/buckets` - Get all buckets

### 6. ✅ Documentation
- `docs/MINIO-SETUP.md` - Hướng dẫn setup chi tiết
- `docs/MINIO-GUIDE.md` - Hướng dẫn sử dụng config

### 7. ✅ Packages
```bash
npm install minio @types/minio @types/multer
```

## 🚀 Cách sử dụng

### Khởi động MinIO
```bash
docker-compose up -d minio
```

### Truy cập Web Console
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin123`

### Test Upload API
```bash
# Upload file
curl -X POST http://localhost:3001/api/media/upload \
  -F "file=@/path/to/your/file.jpg"

# Get buckets
curl http://localhost:3001/api/media/buckets

# List files
curl http://localhost:3001/api/media/list/documents
```

### Sử dụng trong code
```typescript
import { MinioService } from './infrastructure/services/minio.service'

constructor(private readonly minioService: MinioService) {}

async uploadFile(file: Express.Multer.File) {
  const buckets = this.minioService.getBuckets()
  
  const result = await this.minioService.uploadFile(
    buckets.documents,
    `file-${Date.now()}.pdf`,
    file.buffer,
    { 'Content-Type': file.mimetype }
  )
  
  return result // { bucketName, objectKey, publicUrl }
}
```

## 🔗 Tích hợp với Prisma Media Model

Bạn đã có schema Media hoàn chỉnh! Bây giờ có thể:

```typescript
async function uploadAndSave(
  file: Express.Multer.File,
  userId: number,
  prisma: PrismaService,
  minioService: MinioService
) {
  // 1. Upload to MinIO
  const buckets = minioService.getBuckets()
  const { bucketName, objectKey, publicUrl } = 
    await minioService.uploadFile(
      buckets.documents,
      `docs/${Date.now()}.pdf`,
      file.buffer,
      { 'Content-Type': file.mimetype }
    )

  // 2. Save to database
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

  // 3. Link to other models
  await prisma.course.update({
    where: { courseId: 1 },
    data: { thumbnailId: media.mediaId }
  })

  return media
}
```

## ✨ Những điểm nổi bật

1. ✅ **Auto-create buckets** khi app khởi động
2. ✅ **Public read policy** tự động set
3. ✅ **Health check** Docker built-in
4. ✅ **Type-safe** TypeScript
5. ✅ **Global module** - sử dụng ở mọi nơi
6. ✅ **Example controller** để test ngay
7. ✅ **Full CRUD** operations
8. ✅ **Presigned URLs** cho security
9. ✅ **Tích hợp Prisma** schema sẵn sàng

## 📚 Files đã tạo/sửa

```
docker-compose.yml                                    # ✅ Thêm MinIO service
.env                                                  # ✅ Thêm MinIO env vars
src/config/minio.config.ts                           # ✅ NEW
src/config/index.ts                                  # ✅ Export MinioConfig
src/infrastructure/services/minio.service.ts         # ✅ NEW
src/infrastructure/minio.module.ts                   # ✅ NEW
src/infrastructure/infrastructure.module.ts          # ✅ Import MinioModule
src/presentation/controllers/media-upload.controller.ts  # ✅ NEW
src/presentation/presentation.module.ts              # ✅ Add MediaUploadController
docs/MINIO-SETUP.md                                  # ✅ NEW
docs/MINIO-GUIDE.md                                  # ✅ NEW
prisma/schema.prisma                                 # ✅ Đã có Media models
```

## 🎯 Next Steps

1. **Chạy migration** cho Media tables:
```bash
npx prisma migrate dev --name add_media_tables
```

2. **Khởi động server**:
```bash
npm run start:dev
```

3. **Test APIs** tại Swagger:
http://localhost:3001/docs

4. **Kiểm tra MinIO Console**:
http://localhost:9001

## 🔐 Production Checklist

Trước khi deploy production:
- [ ] Thay đổi MINIO_ACCESS_KEY và MINIO_SECRET_KEY
- [ ] Enable SSL (MINIO_USE_SSL=true)
- [ ] Setup reverse proxy cho MinIO
- [ ] Backup policies cho buckets
- [ ] Monitor storage usage
- [ ] Setup CDN nếu cần

---

## 🎊 HOÀN TẤT!

MinIO đã được tích hợp hoàn toàn vào dự án BEE!
- ✅ Docker container đang chạy
- ✅ Service đã config
- ✅ APIs sẵn sàng
- ✅ Database schema ready
- ✅ Documentation đầy đủ

**Giờ bạn có thể upload và quản lý media với MinIO! 🚀**
