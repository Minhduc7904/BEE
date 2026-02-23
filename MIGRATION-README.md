# 📚 Database Migration System

Hệ thống migration dữ liệu từ database cũ sang database mới cho dự án BEE.

## 📁 Cấu trúc thư mục

```
BEE/
├── backup/
│   └── backup.sql                    # File backup từ DB cũ
├── docs/
│   └── MIGRATION-GUIDE.md            # Hướng dẫn chi tiết
├── prisma/
│   ├── schema.prisma                 # Schema DB mới (hiện tại)
│   ├── schema-old.prisma             # Schema DB cũ
│   └── migrators/
│       ├── QUICKSTART.md             # Hướng dẫn nhanh
│       ├── README.md                 # Tài liệu utilities
│       ├── types.ts                  # TypeScript types
│       ├── utils.ts                  # Utility functions
│       ├── db-clients.ts             # Database connections
│       ├── index.ts                  # Main migration script
│       ├── migrate-template.ts       # Template cho migrator mới
│       ├── migrate-users.ts          # Migrate users
│       ├── migrate-students.ts       # Migrate students
│       ├── migrate-subjects.ts       # Migrate subjects
│       ├── migrate-chapters.ts       # Migrate chapters
│       └── migrate-questions.ts      # Migrate questions
├── scripts/
│   ├── import-old-db.ps1             # Import SQL (Windows)
│   └── import-old-db.sh              # Import SQL (Linux/Mac)
└── volumes/                          # Docker volumes (gitignored)
    ├── mysql_data/                   # Data DB mới
    └── mysql_old_data/               # Data DB cũ (nếu dùng)
```

## 🚀 Quick Start

### 1. Cấu hình

```bash
# Copy .env.example thành .env (nếu chưa có)
cp .env.example .env
```

Thêm vào `.env`:
```env
# Database mới
DATABASE_URL="mysql://root:070904@localhost:3307/beedatabase"

# Database cũ
OLD_DATABASE_URL="mysql://root:070904@localhost:3307/old_beedatabase"
```

### 2. Cập nhật Schema Cũ

Chỉnh sửa `prisma/schema-old.prisma` theo cấu trúc DB cũ của bạn.

### 3. Chạy Migration

```bash
# Option 1: Chạy toàn bộ (recommended)
npm run migrate:full

# Option 2: Từng bước
npm run migrate:generate-old  # Generate Prisma Client cho old_db
npm run migrate:import        # Import backup.sql vào old_db
npm run migrate:run          # Chạy migration
```

## 📝 npm scripts

| Script | Mô tả |
|--------|-------|
| `npm run migrate:generate-old` | Generate Prisma Client cho old_db |
| `npm run migrate:import` | Import backup.sql vào old_db |
| `npm run migrate:run` | Chạy migration |
| `npm run migrate:full` | Chạy toàn bộ (generate + import + migrate) |

## 🔧 Thêm Migrator Mới

### Bước 1: Copy template

```bash
cp prisma/migrators/migrate-template.ts prisma/migrators/migrate-courses.ts
```

### Bước 2: Cập nhật logic

```typescript
export async function migrateCourses() {
  console.log('🚀 Starting Course migration...');

  try {
    // 1. Đọc từ old_db
    const oldCourses = await oldDb.oldCourse.findMany();
    
    // 2. Process từng record
    for (const oldCourse of oldCourses) {
      // 2.1. Kiểm tra tồn tại
      const existing = await newDb.course.findUnique({
        where: { courseId: oldCourse.id },
      });
      
      if (existing) {
        skipCount++;
        continue;
      }
      
      // 2.2. Map data
      await newDb.course.create({
        data: {
          title: oldCourse.name,
          subjectId: oldCourse.subject_id,
          // ... mapping khác
        },
      });
      
      successCount++;
    }
    
    return { successCount, skipCount, errorCount, total };
  } catch (error) {
    console.error('❌ Course migration failed:', error);
    throw error;
  }
}
```

### Bước 3: Thêm vào main script

Chỉnh sửa `prisma/migrators/index.ts`:

```typescript
import { migrateCourses } from './migrate-courses';

async function main() {
  // ... existing code ...
  
  // Thêm migration mới
  console.log('\n📚 STEP 6: Migrating Courses...');
  results.courses = await migrateCourses();
  
  // ... existing code ...
}
```

## 🔍 Debugging

```bash
# Kiểm tra kết nối old_db
npx prisma db pull --schema=prisma/schema-old.prisma

# Xem dữ liệu old_db trong Prisma Studio
npx prisma studio --schema=prisma/schema-old.prisma

# Xem dữ liệu new_db
npx prisma studio
```

## 📊 Thứ tự Migration (Recommended)

1. **Subjects** - Môn học (không phụ thuộc)
2. **Chapters** - Chương (phụ thuộc Subjects)
3. **Users** - Người dùng (không phụ thuộc)
4. **Students** - Học sinh (phụ thuộc Users)
5. **Admins** - Quản trị viên (phụ thuộc Users, Subjects)
6. **Questions** - Câu hỏi (phụ thuộc Chapters)
7. **Exams** - Đề thi (phụ thuộc Subjects, Admins)
8. **Courses** - Khóa học (phụ thuộc Subjects, Admins)
9. **Lessons** - Bài học (phụ thuộc Courses)

## ⚠️ Lưu ý

- ✅ **Backup trước**: Luôn backup database mới trước khi migrate
- ✅ **Test trước**: Chạy thử trên môi trường dev
- ✅ **Idempotent**: Migration có thể chạy lại nhiều lần
- ✅ **Skip existing**: Records đã tồn tại sẽ tự động skip
- ✅ **Error handling**: Lỗi ở 1 record không làm dừng toàn bộ migration

## 🛠️ Utilities Functions

File `prisma/migrators/utils.ts` cung cấp các hàm tiện ích:

### Data Processing
- `sanitizeString(str)` - Làm sạch chuỗi
- `parseDate(dateStr)` - Parse date an toàn
- `parseNumber(value)` - Parse number với default
- `generateSlug(text)` - Tạo slug từ text
- `isValidEmail(email)` - Validate email

### Batch Processing
- `processBatch(items, batchSize, processor)` - Xử lý theo batch
- `sleep(ms)` - Delay

### Error Handling
- `retry(fn, maxRetries, delay)` - Retry với exponential backoff

### Logging
- `logProgress(entity, current, total, message)` - Log progress
- `logResult(entity, result)` - Log kết quả
- `formatDuration(ms)` - Format thời gian

## 📖 Tài liệu đầy đủ

- [QUICKSTART.md](./prisma/migrators/QUICKSTART.md) - Hướng dẫn nhanh
- [MIGRATION-GUIDE.md](./docs/MIGRATION-GUIDE.md) - Hướng dẫn chi tiết
- [README.md](./prisma/migrators/README.md) - Utilities documentation

## 🎯 Ví dụ Output

```
╔═══════════════════════════════════════════╗
║   🔄 DATABASE MIGRATION SCRIPT           ║
║   Old DB → New DB                        ║
╚═══════════════════════════════════════════╝

✅ Connected to OLD database
✅ Connected to NEW database

📚 STEP 1: Migrating Subjects...
📊 Found 5 subjects in old database
[1/5] (20.0%) Subjects: ✅ Success
[2/5] (40.0%) Subjects: ✅ Success
...

📈 Subject Migration Summary:
  ✅ Success: 5
  ⏭️  Skipped: 0
  ❌ Errors: 0
  📊 Total: 5

...

╔═══════════════════════════════════════════╗
║   🎯 OVERALL TOTALS                      ║
╚═══════════════════════════════════════════╝
  ✅ Total Success: 1234
  ⏭️  Total Skipped: 56
  ❌ Total Errors: 2
  📊 Total Records: 1292
  ⏱️  Duration: 12.34s

✨ Migration completed!
```

## 🐳 Docker Support

Nếu muốn chạy old_db trong Docker container riêng, thêm vào `docker-compose.yml`:

```yaml
services:
  mysql_old:
    image: mysql:8.0
    container_name: mysql_old_db
    environment:
      MYSQL_ROOT_PASSWORD: "070904"
      MYSQL_DATABASE: "old_beedatabase"
    ports:
      - "127.0.0.1:3308:3306"
    volumes:
      - ./volumes/mysql_old_data:/var/lib/mysql
```

Update `OLD_DATABASE_URL`:
```env
OLD_DATABASE_URL="mysql://root:070904@localhost:3308/old_beedatabase"
```

## 🤝 Contributing

Khi thêm migrator mới:
1. Copy `migrate-template.ts`
2. Update logic theo entity
3. Thêm vào `index.ts`
4. Test kỹ trên dev
5. Commit với message rõ ràng

---

Made with ❤️ for BEE Project
