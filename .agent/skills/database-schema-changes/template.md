# Mẫu thiết kế Prisma/MySQL schema và migration

## 1. Tóm tắt thay đổi

| Hạng mục | Thiết kế | Lý do nghiệp vụ | Ảnh hưởng dữ liệu cũ |
| --- | --- | --- | --- |
| Model/field/enum | `<tên>` | `<rule/ownership/lifecycle>` | `<không có/backfill/migration kế thừa>` |
| Relation | `<A → B>` | `<ý nghĩa relation>` | `<onDelete và row cũ>` |
| Unique/index | `<fields>` | `<invariant hoặc query>` | `<chi phí/khóa/rủi ro>` |

## 2. Enum và model Prisma

```prisma
// Trạng thái lifecycle của <Feature>; transition do application use case kiểm soát.
enum <Feature>Status {
  PENDING
  ACTIVE
  INACTIVE
}

// Lưu <ý nghĩa nghiệp vụ và ownership>.
model <Feature> {
  featureId Int @id @default(autoincrement()) @map("feature_id")

  // Mã định danh nghiệp vụ, không được trùng trong phạm vi <scope>.
  code String @unique @map("code") @db.VarChar(50)

  // Trạng thái hữu hạn; không dùng String tự do.
  status <Feature>Status @default(PENDING) @map("status")

  // Chủ sở hữu <aggregate>; Restrict để giữ lịch sử <Feature>.
  ownerId Int @map("owner_id")
  owner   <Owner> @relation(fields: [ownerId], references: [ownerId], onDelete: Restrict)

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp(0)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp(0)

  // Phục vụ query lọc theo owner và status.
  @@index([ownerId, status], map: "idx_features_owner_status")
  @@map("features")
}
```

Thay `<Owner>` bằng model thật. Không copy `Cascade`, default hay index từ mẫu nếu business rule/query không cần.

## 3. Kế hoạch migration

| Bước | Thay đổi | Dữ liệu cũ/rollback | Điều kiện chuyển bước |
| --- | --- | --- | --- |
| Expand | `<add nullable field/table/enum value>` | `<không phá row cũ>` | `<schema/migration SQL đã review>` |
| Backfill | `<job/script/admin action>` | `<batch, idempotency, metric>` | `<không còn row thiếu>` |
| Switch | `<application bắt đầu ghi/đọc field mới>` | `<fallback tạm thời>` | `<build/deploy ổn>` |
| Contract | `<required/unique/drop field cũ nếu được duyệt>` | `<backup/rollback plan>` | `<owner phê duyệt>` |

Với thay đổi không phá vỡ, ghi rõ vì sao có thể bỏ bớt bước. Với enum/FK/unique/nullability/drop/rename, không bỏ phần backfill và deploy plan.

## 4. SQL review

Sau `npm run prisma:migrate:dev -- --name <ten_thay_doi>`, kiểm tra:

- [ ] Table/column đúng snake_case và kiểu MySQL đúng.
- [ ] `NOT NULL`, default và enum an toàn với row cũ.
- [ ] FK reference và `ON DELETE` đúng retention/business rule.
- [ ] `CREATE UNIQUE INDEX`/`CREATE INDEX` đúng field/thứ tự/name.
- [ ] Không có `DROP TABLE`, `DROP COLUMN`, rename, alter destructive hoặc data loss chưa được duyệt.
- [ ] Có backfill/rollback plan nếu SQL thay đổi dữ liệu hoặc khóa bảng đáng kể.

## 5. Bản đồ mã cần cập nhật

| Lớp | Tệp/điểm cần kiểm tra | Thay đổi cần có |
| --- | --- | --- |
| Domain | `src/domain/entities/`, `src/domain/interface/` | Entity/value type/enum contract. |
| Application | DTO/use case/interface | Input/output, business validation, transition. |
| Infrastructure | Mapper/repository/module | Prisma select/include, mapper, filter/index query, DI. |
| Presentation | Controller/Gateway/docs | Response API/Event, permission, `docs/api`/`docs/event` khi contract thay đổi. |

## 6. Báo cáo bàn giao

```md
- Schema: `<model/field/enum/relation/index>` — `<lý do>`.
- Migration: `<timestamp_name>`; SQL đã kiểm tra `<điểm an toàn/rủi ro>`.
- Dữ liệu cũ: `<không có/backfill và owner thực hiện>`.
- Đã chạy: `<prisma generate/build/migrate status>`.
- Còn lại: `<deploy/backfill/docs/API/Event hoặc không có>`.
```
