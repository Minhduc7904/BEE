# Quy trình Prisma Migrate

Tài liệu này là quy ước bắt buộc khi thay đổi cấu trúc database của BEE. Không dùng `prisma db push` cho database dùng chung, staging hoặc production.

## Lệnh chuẩn

```bash
# Tạo Prisma Client sau khi thay đổi schema hoặc sau khi cài dependency
npm run prisma:generate

# Tạo và áp dụng migration mới trên database local/dev
npm run prisma:migrate:dev -- --name <ten_thay_doi>

# Kiểm tra database đã áp dụng đủ migration chưa
npm run prisma:migrate:status

# Áp dụng các migration đã commit, không tạo migration mới
npm run prisma:migrate:deploy
```

`prisma:migrate:dev` chỉ dùng ở máy local/dev. `prisma:migrate:deploy` dùng ở staging/production và có thể dùng local để kiểm tra cách deploy.

## Khi cần tạo bảng hoặc thay đổi schema

Thực hiện đúng thứ tự sau:

1. Kiểm tra trạng thái hiện tại:

   ```bash
   npm run prisma:migrate:status
   ```

   Nếu còn migration pending, áp dụng trước bằng `npm run prisma:migrate:deploy`. Không tạo migration mới trên một database đang thiếu migration cũ.

2. Sửa `prisma/schema.prisma`: thêm model, enum, quan hệ, index và `@@map`/`@map` theo quy ước bảng/cột hiện có.

3. Tạo migration trên local/dev:

   ```bash
   npm run prisma:migrate:dev -- --name create_<ten_bang>
   ```

   Ví dụ: `npm run prisma:migrate:dev -- --name create_course_reviews`.

4. Đọc file `prisma/migrations/<timestamp>_create_<ten_bang>/migration.sql`. Với thay đổi có nguy cơ mất dữ liệu (drop cột, đổi kiểu cột, thêm cột `NOT NULL`), phải xác nhận SQL và kế hoạch backfill trước khi tiếp tục.

5. Generate client và build để bắt lỗi type:

   ```bash
   npm run prisma:generate
   npm run build
   ```

6. Commit đồng thời các file sau:

   - `prisma/schema.prisma`
   - Thư mục migration mới trong `prisma/migrations/`
   - Code repository/service sử dụng bảng mới (nếu có)

7. Khi deploy, chạy migration trước khi restart ứng dụng:

   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:migrate:status
   ```

   Remote deploy script phải chạy hai lệnh trên với đúng `DATABASE_URL` của môi trường đích.

## Quy tắc an toàn

- Không sửa hoặc xoá migration đã được áp dụng ở bất kỳ môi trường dùng chung nào. Tạo migration mới để sửa tiếp.
- Không dùng `prisma db push` để thay thế migration. Lệnh này không lưu lịch sử migration và có thể làm schema drift.
- Không dùng `prisma migrate dev` trên production vì lệnh này phục vụ phát triển và có thể yêu cầu shadow database.
- Luôn backup trước migration có nguy cơ mất dữ liệu hoặc khóa bảng lâu.
- Không commit `.env`, URL database hoặc mật khẩu.

## Khởi tạo migration cho database đã tồn tại

Baseline hiện tại là `20260714000000_baseline_existing_production`.

### Database trống

Chạy:

```bash
npm run prisma:migrate:deploy
```

Baseline sẽ tạo toàn bộ schema.

### Database đã có sẵn schema tương ứng baseline

Không chạy `migrate deploy` ngay vì migration baseline sẽ cố tạo lại các bảng. Sau backup và khi đã xác nhận schema khớp, đánh dấu baseline là đã áp dụng:

```bash
npx prisma migrate resolve --applied 20260714000000_baseline_existing_production
npm run prisma:migrate:deploy
npm run prisma:migrate:status
```

Chỉ dùng `migrate resolve --applied` khi chắc chắn database đã có đúng cấu trúc của migration đó.

## Khắc phục lỗi type Prisma bị thiếu

Nếu TypeScript báo thiếu type như `Prisma.AdminWhereInput` hoặc `Prisma.TransactionIsolationLevel`, Prisma Client thường chưa được generate hoặc đang bị stale:

```bash
npm run prisma:generate
npm run build
```

Nếu vẫn lỗi, kiểm tra `prisma/schema.prisma`, version `prisma` và `@prisma/client` phải tương thích, rồi cài lại dependencies trước khi generate lại.
