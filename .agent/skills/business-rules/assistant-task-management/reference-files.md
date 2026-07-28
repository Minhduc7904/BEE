# Tài liệu tham chiếu AssistantTask

| Tệp | Mục đích | Quy ước |
| --- | --- | --- |
| `prisma/schema.prisma` | Schema nguồn | Product có owner; quan hệ task-product chỉ đi qua submission. |
| `prisma/migrations/20260728202500_add_assistant_task_product_submissions/migration.sql` | Migration | Expand, backfill liên kết cũ, contract khóa ngoại một-nhiều. |
| `src/domain/entities/assistant-task/` | Domain entity | Không chứa HTTP/permission; taskName mở và taskType enum. |
| `src/domain/interface/assistant-task/assistant-task.interface.ts` | Contract persistence | Relation options quyết định include task/product. |
| `src/domain/repositories/assistant-task*.repository.ts` | Repository ports | Có count/filter phục vụ pagination và invariant submission. |
| `src/infrastructure/mappers/assistant-task/` | Mapper | Include many-to-many qua `submissions -> task/product`. |
| `src/infrastructure/repositories/assistant-task/` | Prisma adapter | Chỉ persistence/filter, không quyết định ownership/state. |
| `src/application/dtos/assistant-task/` | HTTP DTO | Self DTO không có owner/quantity; admin DTO quantity nullable và min 0. |
| `src/application/use-cases/assistant-task/` | Application rules | Ownership, exam creator, transition, audit và transaction. |
| `src/presentation/controllers/assistant-task*.controller.ts` | HTTP routes | Ba controller theo ba bảng; route tĩnh `/me`, `/manage` đứng trước `:id`. |
| `src/shared/constants/permissions/permission.codes.ts` | Authorization | Permission quản trị và self attach/detach tách biệt. |
| `docs/api/assistant-task-management.md` | API handoff | Contract endpoint, filter và side effect cho FE. |
