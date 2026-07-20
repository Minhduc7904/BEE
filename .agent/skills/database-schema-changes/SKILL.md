---
name: database-schema-changes
description: Thiết kế và thay đổi Prisma/MySQL schema an toàn cho BEE. Dùng khi thêm hoặc sửa bảng, cột, enum, relation, unique/index hay Prisma migration; bao gồm đánh giá business rule, dữ liệu cũ, SQL migration, Prisma generate và build.
---

# Thay đổi Database Schema

## Mục tiêu

Thay đổi `prisma/schema.prisma` theo Prisma/MySQL và Clean Architecture của BEE. Schema phải diễn đạt đúng nghiệp vụ, giữ dữ liệu lịch sử, có migration kiểm tra được và không làm Application phụ thuộc Prisma.

Skill này có đúng ba tệp. Đọc [template.md](template.md) để soạn thiết kế schema/migration và [reference-files.md](reference-files.md) để đối chiếu convention cùng mã nguồn thật.

## Trước khi thiết kế hoặc sửa schema

1. Đọc `template.md`, `reference-files.md`, model/relation liên quan, migration gần nhất và repository/mapper/use case sử dụng dữ liệu đó.
2. Đọc `business-rules` khi thay đổi ownership, lifecycle, status, xóa, tiền hoặc policy; business rule quyết định schema, không suy diễn ngược từ schema.
3. Đọc `create-enum` trước khi thêm/sửa enum. Giá trị hữu hạn như status, type, provider, visibility hoặc source phải dùng enum Prisma/shared enum phù hợp, không dùng `String` tự do.
4. Đọc `create-domain-entity`, `create-prisma-mapper`, `create-prisma-repository`, `create-dto` và `create-application-use-case` khi schema tác động các lớp đó.
5. Chạy GitNexus impact analysis trước khi sửa class/method/symbol code đang tồn tại; báo người dùng nếu rủi ro HIGH/CRITICAL.
6. Xác định dữ liệu cũ, truy vấn/filter/sort, unique/idempotency, relation, `onDelete`, retention, backfill và rollback trước khi migration.

## Quy tắc schema BEE

### Model, tên và timestamp

- Prisma field dùng camelCase; database dùng snake_case qua `@map`; table dùng `@@map`.
- Mỗi model/field/relation mới có comment tiếng Việt có dấu: ý nghĩa nghiệp vụ, ownership/lifecycle và lý do optional/default khi không hiển nhiên.
- Theo convention model gần nhất: primary key `Int @id @default(autoincrement())`, timestamp `createdAt`/`updatedAt` map snake_case và kiểu `@db.Timestamp(0)` khi phù hợp.
- Dùng `@db.VarChar(n)`, `@db.Text`, `@db.Date`, `@db.Timestamp(0)` theo dữ liệu thật; không mặc định `String`/`Text` không giới hạn chỉ để tiện.

### Enum

- Tạo enum Prisma cho tập giá trị đóng. Đặt tên rõ theo aggregate, ví dụ `<Feature>Status`, `<Feature>Type`, `<Feature>Provider`.
- Ghi lifecycle/default của enum trong comment/business rule. Không dùng enum thay cho dữ liệu có thể thay đổi bởi admin mà cần bảng quản lý.
- Thêm hoặc đổi enum là thay đổi production-sensitive: đọc SQL migration, xác minh dữ liệu cũ và deploy plan; không rename/reorder/loại value tùy tiện.

### Relation, xóa và lịch sử

- Khóa ngoại có field `...Id`, relation name khi cần phân biệt nhiều relation và index cho lookup FK nếu chưa được unique/index bao phủ.
- Chọn `onDelete` có chủ đích: dùng `Restrict` cho aggregate/lịch sử tài chính cần giữ; `SetNull` khi child vẫn có ý nghĩa sau khi parent mất; `Cascade` chỉ cho child thực sự không thể tồn tại độc lập.
- Không hard-delete dữ liệu có audit, payment, transaction, attempt, history hoặc retention. Dùng status/soft-delete theo business rule, không tự thêm `deletedAt` nếu chưa được phê duyệt.
- Relation optional phải phản ánh dữ liệu thật và có kế hoạch backfill; không làm FK required ngay khi bảng cũ còn row chưa có giá trị.

### Unique và index

- Unique biểu đạt identity hoặc invariant thật: code, provider transaction ID hoặc composite idempotency key.
- Thêm index từ query thực tế: FK join, filter + sort, lookup webhook/reconciliation. Không tạo index trùng primary key/unique hoặc index “để dự phòng”.
- Với index composite, đặt thứ tự field theo filter/selectivity/sort của repository thực tế; ghi lý do trong thiết kế.
- Constraint không biểu đạt được ở MySQL/Prisma phải được thực thi tại use case và ghi rõ trong business rule, không giả vờ schema đã bảo vệ.

## Migration an toàn

1. Kiểm tra trạng thái trước:

   ```bash
   npm run prisma:migrate:status
   ```

   Nếu migration pending/drift, dừng và xử lý trạng thái môi trường trước; không chồng migration mới lên tình trạng chưa rõ.

2. Cập nhật schema cùng comments, enum, relation, map, unique/index cần thiết.

3. Tạo migration mô tả rõ thay đổi:

   ```bash
   npm run prisma:migrate:dev -- --name <ten_thay_doi>
   ```

   PowerShell khi npm không chuyển đúng tham số:

   ```powershell
   npm.cmd --% run prisma:migrate:dev -- --name <ten_thay_doi>
   ```

   Không dùng `prisma db push` thay migration.

4. Đọc toàn bộ `prisma/migrations/<timestamp>_<ten_thay_doi>/migration.sql`. Kiểm tra `DROP`, `ALTER`, enum, default, nullability, FK, `ON DELETE`, unique/index và lock/rủi ro dữ liệu.

5. Với thay đổi phá vỡ, dùng kế hoạch expand → backfill → switch application → contract. Không gộp add non-null column, backfill và drop cột cũ vào một bước khi production data chưa được xác minh.

6. Đồng bộ và kiểm tra:

   ```bash
   npm run prisma:generate
   npm run build
   npm run prisma:migrate:status
   ```

7. Môi trường không phải development chỉ áp dụng migration đã commit:

   ```bash
   npm run prisma:migrate:deploy
   npm run prisma:migrate:status
   ```

Không bắt buộc unit test vì dự án chưa có luồng này. Khi schema đổi, build/generate và migration status là kiểm tra tối thiểu; chạy lệnh phù hợp phạm vi và báo trung thực lệnh chưa chạy.

## Sau khi schema đổi

1. Regenerate Prisma Client trước khi sửa mã phụ thuộc type mới.
2. Cập nhật domain entity/value type, application interface, Prisma mapper/repository, DTO/use case/controller/Gateway theo lớp bị tác động; Application không gọi Prisma trực tiếp.
3. Kiểm tra seed, import/migrator, job/reconciliation và docs API/event khi chúng phụ thuộc enum, field hoặc response thay đổi.
4. Không sửa migration đã commit/áp dụng. Migration correction là file mới, kèm lý do và backfill/rollback plan.

## Điều không được làm

- Không dùng `prisma db push`, không rewrite/xóa migration lịch sử.
- Không thêm status/type/provider/source dạng `String` khi enum phù hợp.
- Không dùng `Cascade` hoặc hard-delete chỉ để migration đơn giản hơn.
- Không thêm cột required/unique/FK mới mà không đánh giá dữ liệu cũ/backfill.
- Không tạo index/unique không có invariant hoặc query thật.
- Không chỉ sửa schema mà bỏ mapper/repository/type contract bị ảnh hưởng.
- Không yêu cầu unit test trong giai đoạn hiện tại.

## Checklist trước khi bàn giao

- [ ] Business rule, ownership, lifecycle, dữ liệu cũ và onDelete đã chốt.
- [ ] Model/field/relation/enum có comment tiếng Việt có dấu, `@map`/`@@map`, kiểu DB và optionality đúng.
- [ ] Enum dùng cho tập giá trị đóng; index/unique dựa trên invariant/query thật.
- [ ] Migration SQL đã đọc; rủi ro destructive/backfill/deploy đã nêu.
- [ ] Prisma generate, build và migration status đã chạy hoặc lý do chưa chạy được báo rõ.
- [ ] Lớp entity/mapper/repository/use case/DTO/API/Event bị tác động đã được đánh giá.
