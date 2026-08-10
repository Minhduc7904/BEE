# Tài liệu tham chiếu

| Mục đích                     | Tệp                                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| HTTP routes Book             | `src/presentation/controllers/book.controller.ts`                                                             |
| CRUD, SEO và quy tắc publish | `src/application/use-cases/book/book.use-cases.ts`                                                            |
| API Student Book             | `src/application/use-cases/book/get-student-*.use-case.ts` và `increment-student-book-view-count.use-case.ts` |
| Aggregate/repository         | `src/domain/entities/book/`, `src/domain/repositories/book.repository.ts`                                     |
| Persistence                  | `src/infrastructure/repositories/book/prisma-book.repository.ts`                                              |
| DTO và pagination            | `src/application/dtos/book/`                                                                                  |
| Permission/role              | `src/shared/constants/permissions/`, `src/shared/decorators/permission.decorator.ts`                          |
| API contract                 | `docs/api/books.md`                                                                                           |

## Cảnh báo

- Media trả về `viewUrl` có thời hạn, không được lưu lâu dài ở frontend.
- Các endpoint StudentFE chỉ là đọc catalog và ghi lượt xem; không được hiểu là quyền mua hoặc sở hữu sách.
- Schema và migration Book hiện có phải được giữ nguyên; thêm đơn hàng/thanh toán cần một business rule và thiết kế dữ liệu riêng.
