# 🔄 DATABASE MIGRATION GUIDE  

Hướng dẫn migrate dữ liệu từ database cũ sang database mới.

## 📋 Tổng quan

Hệ thống migration này cho phép:
- ✅ Kết nối đồng thời 2 databases (old_db và new_db)
- ✅ Đọc dữ liệu từ database cũ
- ✅ Transform và mapping sang schema mới
- ✅ Insert vào database mới với validation

## 🏗️ Cấu trúc

```
prisma/
├── schema.prisma          # Schema database mới (hiện tại)
├── schema-old.prisma      # Schema database cũ
└── migrators/
    ├── db-clients.ts      # Kết nối 2 databases
    ├── index.ts           # Script chính chạy migration
    ├── migrate-users.ts   # Migrate users
    ├── migrate-students.ts
    ├── migrate-subjects.ts
    ├── migrate-chapters.ts
    └── migrate-questions.ts

scripts/
├── import-old-db.ps1      # Import SQL vào old_db (Windows)
└── import-old-db.sh       # Import SQL vào old_db (Linux/Mac)

backup/
└── backup.sql             # File backup từ database cũ
```

## 🚀 Cách sử dụng

### Bước 1: Chuẩn bị file backup.sql

Đặt file backup của database cũ vào thư mục `backup/backup.sql`

```bash
# Nếu cần export từ database cũ
mysqldump -u root -p old_database > backup/backup.sql
```

### Bước 2: Cấu hình .env

Thêm connection string cho database cũ vào file `.env`:

```env
# Database mới (hiện tại)
DATABASE_URL="mysql://root:070904@localhost:3307/beedatabase"

# Database cũ (để import dữ liệu)
OLD_DATABASE_URL="mysql://root:070904@localhost:3307/old_beedatabase"
```

### Bước 3: Cập nhật schema-old.prisma

Cập nhật file `prisma/schema-old.prisma` để phản ánh đúng cấu trúc database cũ:

```prisma
// Ví dụ:
model OldUser {
  id           Int       @id @default(autoincrement())
  username     String    @unique
  email        String?
  // ... các trường khác từ DB cũ
  
  @@map("users")  // tên bảng thực tế trong DB cũ
}

model OldStudent {
  id           Int       @id @default(autoincrement())
  // ... các trường từ DB cũ
  
  @@map("students")
}
```

### Bước 4: Generate Prisma Client cho old_db

```bash
# Generate client cho database cũ
npx prisma generate --schema=prisma/schema-old.prisma

# Kiểm tra client đã được generate
ls generated/prisma-old/
```

### Bước 5: Import backup.sql vào old_db

**Windows (PowerShell):**
```powershell
.\scripts\import-old-db.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/import-old-db.sh
./scripts/import-old-db.sh
```

### Bước 6: Cập nhật logic migration

Cập nhật các file migrator trong `prisma/migrators/` để mapping dữ liệu từ old schema sang new schema:

**Ví dụ: `migrate-users.ts`**
```typescript
// Đọc từ old_db
const oldUsers = await oldDb.oldUser.findMany();

// Transform và insert vào new_db
for (const oldUser of oldUsers) {
  await newDb.user.create({
    data: {
      // Mapping từ old sang new
      username: oldUser.username,
      email: oldUser.email,
      // Thêm các trường mới với giá trị mặc định
      gender: null,
      dateOfBirth: null,
      isEmailVerified: false,
    },
  });
}
```

### Bước 7: Chạy migration

```bash
# Build TypeScript
npm run build

# Chạy migration
npx ts-node prisma/migrators/index.ts
```

## 📊 Thứ tự migration

Migration được chạy theo thứ tự phụ thuộc:

1. **Subjects** (môn học) - không phụ thuộc
2. **Chapters** (chương) - phụ thuộc Subject
3. **Users** (người dùng) - không phụ thuộc
4. **Students** (học sinh) - phụ thuộc User
5. **Questions** (câu hỏi) - phụ thuộc Chapter

## 🛠️ Thêm migrator mới

Để thêm migrator cho entity mới:

1. Tạo file `migrate-<entity>.ts`:

```typescript
import { oldDb, newDb } from './db-clients';

export async function migrate<Entity>() {
  console.log('🚀 Starting <Entity> migration...');

  try {
    const oldRecords = await oldDb.old<Entity>.findMany();
    console.log(`📊 Found ${oldRecords.length} records`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const record of oldRecords) {
      try {
        // Kiểm tra đã tồn tại
        const existing = await newDb.<entity>.findUnique({
          where: { /* unique field */ },
        });

        if (existing) {
          skipCount++;
          continue;
        }

        // Mapping và insert
        await newDb.<entity>.create({
          data: {
            // mapping fields
          },
        });

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`❌ Error:`, error.message);
      }
    }

    return { successCount, skipCount, errorCount, total: oldRecords.length };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
```

2. Thêm vào `index.ts`:

```typescript
import { migrate<Entity> } from './migrate-<entity>';

// Trong main()
results.<entity> = await migrate<Entity>();
```

## ⚠️ Lưu ý quan trọng

1. **Backup trước khi migrate**: Luôn backup database mới trước khi chạy migration
2. **Test trên môi trường dev**: Chạy thử trên database dev trước
3. **Kiểm tra foreign keys**: Đảm bảo migrate theo đúng thứ tự phụ thuộc
4. **Xử lý lỗi**: Mỗi migrator có error handling riêng, migration sẽ tiếp tục nếu 1 record lỗi
5. **Idempotent**: Migration có thể chạy lại nhiều lần, records đã tồn tại sẽ được skip

## 🔍 Debugging

```bash
# Kiểm tra kết nối old_db
npx prisma db pull --schema=prisma/schema-old.prisma

# Xem dữ liệu old_db
npx prisma studio --schema=prisma/schema-old.prisma

# Xem dữ liệu new_db
npx prisma studio
```

## 📝 Ví dụ output

```
╔═══════════════════════════════════════════╗
║   🔄 DATABASE MIGRATION SCRIPT           ║
║   Old DB → New DB                        ║
╚═══════════════════════════════════════════╝

✅ Connected to OLD database
✅ Connected to NEW database

📚 STEP 1: Migrating Subjects...
📊 Found 5 subjects in old database
✅ Migrated subject: Toán
✅ Migrated subject: Lý
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

## 🔗 Docker MySQL setup

Nếu cần tạo container riêng cho old_db:

```yaml
# docker-compose.yml
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

Sau đó update `OLD_DATABASE_URL`:
```env
OLD_DATABASE_URL="mysql://root:070904@localhost:3308/old_beedatabase"
```
