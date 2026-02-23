# 🎯 QUICK START - Database Migration

## Bước 1: Chuẩn bị

```bash
# 1. Copy file .env.example thành .env nếu chưa có
cp .env.example .env

# 2. Chỉnh sửa OLD_DATABASE_URL trong .env
# OLD_DATABASE_URL="mysql://root:070904@localhost:3307/old_beedatabase"
```

## Bước 2: Cập nhật Schema Cũ

Mở file `prisma/schema-old.prisma` và thêm models từ database cũ:

```prisma
model OldUser {
  id           Int       @id @default(autoincrement())
  username     String    @unique
  // ... thêm các trường khác
  
  @@map("users")  // tên bảng trong DB cũ
}
```

## Bước 3: Generate Client cho Old DB

```bash
npm run migrate:generate-old
```

## Bước 4: Import Backup SQL

```bash
# Đặt file backup.sql vào thư mục backup/
# Sau đó chạy:
npm run migrate:import
```

## Bước 5: Cập nhật Logic Migration

Mở các file trong `prisma/migrators/` và cập nhật logic mapping:

```typescript
// migrate-users.ts
const oldUsers = await oldDb.oldUser.findMany();

for (const oldUser of oldUsers) {
  await newDb.user.create({
    data: {
      username: oldUser.username,
      email: oldUser.email,
      // ... mapping fields
    },
  });
}
```

## Bước 6: Chạy Migration

```bash
# Chạy toàn bộ (generate + import + migrate)
npm run migrate:full

# Hoặc chỉ chạy migrate
npm run migrate:run
```

## 📊 Kết quả

```
╔═══════════════════════════════════════════╗
║   🔄 DATABASE MIGRATION SCRIPT           ║
║   Old DB → New DB                        ║
╚═══════════════════════════════════════════╝

✅ Connected to OLD database
✅ Connected to NEW database

📚 STEP 1: Migrating Subjects...
✅ Migrated subject: Toán
✅ Migrated subject: Lý

...

✨ Migration completed!
```

## ⚠️ Lưu ý

- Backup database mới trước khi migrate
- Test trên môi trường dev trước
- Migration có thể chạy lại nhiều lần (idempotent)
- Records đã tồn tại sẽ bị skip

## 🔗 Tài liệu đầy đủ

Xem [MIGRATION-GUIDE.md](../docs/MIGRATION-GUIDE.md) để biết thêm chi tiết.
