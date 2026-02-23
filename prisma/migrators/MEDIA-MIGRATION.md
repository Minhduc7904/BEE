# Media Migration Guide

## Overview
Scripts để migrate media files từ backup MinIO cũ vào MinIO mới với cấu trúc database mới.

## Files

### 1. `migrate-media-helper.ts`
Helper class chứa logic migrate media:
- Upload files từ backup vào MinIO bucket mới
- Tạo Media records trong database
- Tạo MediaUsage records để link media với entities

### 2. `migrate-users.ts` (Updated)
User migration script đã được update để:
- Migrate avatars từ backup khi migrate users
- Tự động tạo Media và MediaUsage records cho avatars

### 3. `test-migrate-avatar.ts`
Test script để test việc migrate avatar:
```bash
npx ts-node prisma/migrators/test-migrate-avatar.ts
```

### 4. `list-backup-files.ts`
Script để xem cấu trúc backup folder:
```bash
npx ts-node prisma/migrators/list-backup-files.ts
```

## Workflow

### 1. Check Backup Structure
```bash
npx ts-node prisma/migrators/list-backup-files.ts
```

Output sẽ hiển thị:
- Tất cả folders trong backup
- Số lượng files trong mỗi folder
- Sample filenames
- Total size

### 2. Test Avatar Migration
Trước khi chạy full migration, test với 1 avatar:
```bash
npx ts-node prisma/migrators/test-migrate-avatar.ts
```

**Lưu ý**: Update `testUserId` và `testAvatarUrl` trong file test trước khi chạy.

### 3. Run Full User Migration
Migration users sẽ tự động migrate avatars:
```bash
npm run migrate:run
```

Hoặc chạy riêng user migration:
```bash
npx ts-node prisma/migrators/migrate-users.ts
```

## Environment Variables

Đảm bảo `.env` có các biến sau:
```env
# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Database URLs
OLD_DATABASE_URL="mysql://root:070904@localhost:3307/toan-thay-bee-database"
DATABASE_URL="mysql://root:070904@localhost:3307/beedatabase"
```

## Bucket Structure

### Old Structure (Backup)
```
backup/minio-backup/
├── avatar/                    # User avatars
├── question-image/           # Question images
├── solution-image/           # Solution images
├── statement-image/          # Statement images
├── exam-file/                # Exam files
├── learning-items-pdf/       # Learning materials
└── ...
```

### New Structure (MinIO)
```
images/                        # Main bucket for images
├── avatars/{userId}/{timestamp}-{filename}
├── questions/{questionId}/{timestamp}-{filename}
├── exams/{examId}/{timestamp}-{filename}
└── ...
```

## Media Record Structure

### Media Table
```typescript
{
  mediaId: number,
  fileName: string,           // Original filename
  originalName: string,       // Original filename
  mimeType: string,          // e.g., "image/jpeg"
  fileSize: bigint,          // in bytes
  type: 'IMAGE',             // MediaType enum
  status: 'READY',           // MediaStatus enum
  bucketName: 'images',      // MinIO bucket
  objectKey: string,         // Path in bucket
  uploadedBy: number,        // User ID
  createdAt: Date,
  updatedAt: Date
}
```

### MediaUsage Table
```typescript
{
  usageId: number,
  mediaId: number,           // Reference to Media
  entityType: 'USER',        // Entity type
  entityId: number,          // User ID
  fieldName: 'avatar',       // Field name
  usedBy: number,            // User ID
  visibility: 'PUBLIC',      // 'PUBLIC' | 'PRIVATE' | 'PROTECTED'
  createdAt: Date
}
```

## Migration Flow for Avatars

1. **Extract filename** từ `oldUser.avatarUrl`
   - Input: `"avatar/1753785603314-filename.jpg"`
   - Extracted: `"1753785603314-filename.jpg"`

2. **Locate file** in backup
   - Path: `backup/minio-backup/avatar/1753785603314-filename.jpg`

3. **Upload to MinIO**
   - Bucket: `images`
   - Object Key: `avatars/{userId}/{timestamp}-{filename}`

4. **Create Media record**
   - Store metadata (size, mime type, etc.)
   - Link to uploader via `uploadedBy`

5. **Create MediaUsage record**
   - entityType: `'USER'`
   - entityId: `userId`
   - fieldName: `'avatar'`
   - usedBy: `userId`
   - visibility: `'PUBLIC'`

## Error Handling

- **File not found**: Warning logged, migration continues
- **Upload failed**: Warning logged, user migrated without avatar
- **Database error**: Migration stops, transaction rollback

## Extending for Other Media Types

Để migrate other media types (questions, exams, etc.), sử dụng `migrateMedia()` method:

```typescript
await mediaHelper.migrateMedia(
    'question-image/some-image.jpg',  // Relative path in backup
    'images',                          // Target bucket
    'QUESTION',                        // Entity type
    questionId,                        // Entity ID
    teacherId,                         // Uploaded by
    'content_image'                    // Field name
);
```

## Testing

### Manual Testing
1. Check MinIO dashboard: `http://localhost:9001`
2. Verify bucket `images` exists
3. Check uploaded files in bucket
4. Query database for Media and MediaUsage records

### SQL Queries
```sql
-- Check migrated avatars
SELECT 
    m.mediaId,
    m.fileName,
    m.bucketName,
    m.objectKey,
    m.fileSize,
    mu.entityType,
    mu.entityId,
    mu.fieldName
FROM media m
JOIN media_usages mu ON m.mediaId = mu.mediaId
WHERE mu.entityType = 'USER' AND mu.fieldName = 'avatar'
LIMIT 10;

-- Count total migrated media
SELECT 
    entityType,
    COUNT(*) as count
FROM media_usages
GROUP BY entityType;
```

## Troubleshooting

### MinIO Connection Failed
- Check Docker container is running: `docker ps`
- Verify MINIO_ENDPOINT and MINIO_PORT in .env
- Check MinIO credentials

### File Not Found in Backup
- Run `list-backup-files.ts` to verify backup structure
- Check file path matches old avatarUrl format
- Ensure backup folder exists at correct location

### Database Constraint Errors
- Check User exists before creating MediaUsage
- Verify bucket name matches schema constraints (max 100 chars)
- Check objectKey length (max 500 chars)

## Performance Considerations

- **Batch Processing**: Consider batching uploads for large migrations
- **Parallel Uploads**: Can upload multiple files concurrently
- **File Size Limits**: Monitor memory usage for large files
- **Network**: Local MinIO upload speed depends on disk I/O

## Next Steps

After successful user/avatar migration:
1. Migrate question images
2. Migrate exam files
3. Migrate solution images
4. Migrate learning materials (PDFs)
5. Verify all media accessible via presigned URLs
