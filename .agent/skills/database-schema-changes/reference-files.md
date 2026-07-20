# Tài liệu tham chiếu cho Database Schema Changes

## Mã nguồn và convention đã đối chiếu

| Tệp | Phân loại | Quy ước rút ra |
| --- | --- | --- |
| `prisma/schema.prisma` | BẮT BUỘC | MySQL, Prisma Client, enum Prisma, camelCase field + `@map`/`@@map`, `@db.VarChar`, `@db.Timestamp(0)` và relation có `onDelete`. |
| `prisma/schema.prisma` — `OnlineCourseInvoice`, `OnlineCourseInvoiceItem`, `OnlineCoursePaymentAttempt` | ƯU TIÊN | Aggregate payment có enum trạng thái/provider, snapshot/lịch sử, `Restrict` cho invoice owner và `Cascade` chỉ cho item/attempt phụ thuộc thật sự. |
| `prisma/migrations/20260719134141_make_reporter_optional/migration.sql` | BẮT BUỘC | Migration Prisma thực tế gồm drop FK, alter nullable, rồi add FK `ON DELETE SET NULL`; luôn review SQL generated. |
| `package.json` | BẮT BUỘC | Lệnh xác minh: `prisma:migrate:status`, `prisma:migrate:dev`, `prisma:migrate:deploy`, `prisma:generate`, `build`. |
| `.agent/skills/shared/architecture.md` | BẮT BUỘC | Schema là nguồn Prisma; presentation/application không được truy cập Prisma trực tiếp. |
| `.agent/skills/shared/clean-architecture-rules.md` | BẮT BUỘC | Mapper/repository giữ Prisma relation/query; use case dùng domain port và Unit of Work cho workflow atomic. |

## Tệp cần đọc theo thay đổi

| Thay đổi | Đọc thêm trước khi code |
| --- | --- |
| Enum/status/type/provider/source | `.agent/skills/create-enum/SKILL.md`, domain enum và DTO hiện có. |
| Business state, ownership, xóa, tiền, payment | `.agent/skills/business-rules/SKILL.md` và business skill feature. |
| Model/entity mới | `.agent/skills/create-domain-entity/SKILL.md`. |
| Prisma record/relations thay đổi | `.agent/skills/create-prisma-mapper/SKILL.md`, `.agent/skills/create-prisma-repository/SKILL.md`. |
| API/Socket response thay đổi | `create-dto`, `create-application-use-case`, `create-presentation-controller`, `create-presentation-gateway`, `docs/api`, `docs/event`. |
| Migration/symbol code đã tồn tại | GitNexus impact analysis theo `AGENTS.md`. |

## Câu hỏi phải trả lời trước migration

1. Aggregate nào sở hữu dữ liệu và actor nào được tạo/sửa/xóa?
2. Giá trị là tập đóng (enum) hay dữ liệu quản trị được (table)?
3. Relation có cần giữ lịch sử khi parent mất không; `Restrict`, `SetNull` hay `Cascade` vì sao?
4. Query repository nào cần unique/index; composite order theo filter/sort nào?
5. Row cũ sẽ có giá trị gì; backfill/idempotency/rollback/deploy được ai phê duyệt?
6. API/Event/DTO/mapper/repository/entity nào thay đổi type/contract sau migration?
