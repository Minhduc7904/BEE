# Tài liệu tham chiếu khi viết Business-Rule Skill

## Nền tảng dự án

| Tệp/skill | Dùng để |
| --- | --- |
| `.agent/skills/shared/architecture.md` | Xác định ranh giới presentation/application/domain/infrastructure. |
| `.agent/skills/shared/clean-architecture-rules.md` | Đặt business rule tại use case, không đặt trong controller/repository. |
| `.agent/skills/business-rules/SKILL.md` | Quy tắc actor, precondition, transition, rejection, audit. |
| `.agent/skills/database-schema-changes/SKILL.md` | Thiết kế bảng/enum/relation/index/migration an toàn. |
| `.agent/skills/create-application-use-case/SKILL.md` | Cách biến rule thành use case/transaction/audit. |
| `.agent/skills/create-presentation-controller/SKILL.md` | Route, DTO HTTP, permission và actor trong controller. |
| `.agent/skills/create-dto/SKILL.md` | DTO request/query/response và validation decorator. |

## Mã nguồn cần khám phá theo loại luồng

| Loại | Điểm bắt đầu |
| --- | --- |
| CRUD/permission | `src/presentation/controllers/<feature>.controller.ts`, `src/shared/constants/permissions/` |
| Application rule | `src/application/use-cases/<feature>/`, `src/domain/repositories/` |
| Schema | `prisma/schema.prisma`, migration gần nhất |
| Notification/audit | `src/application/use-cases/notification/`, `src/domain/repositories/admin-audit-log.repository.ts` |
| Payment | `src/domain/entities/online-course-payment/`, `OnlineCoursePaymentAttempt`, `TuitionPayment` |

## Câu hỏi bắt buộc cho business owner

- Ai được tạo, xem, sửa, xóa hoặc xác nhận dữ liệu?
- State nào là hợp lệ và state nào là cuối cùng?
- Có dữ liệu cũ cần backfill, retention hoặc không được xóa không?
- FE client và FE admin có cùng quyền/filter/response không?
- Có external provider, webhook, idempotency, retry, SLA hoặc secret không?
- Khi rule chưa rõ, quyết định nào cần được phê duyệt trước khi code?
