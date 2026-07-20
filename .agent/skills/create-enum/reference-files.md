# Tệp tham chiếu cho `create-enum`

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/shared/enums/visibility.enum.ts` | Shared enum có nhãn/mô tả | Enum string UPPER_SNAKE_CASE, có `Record<Visibility, string>` cho nội dung hiển thị; ghi rõ đồng bộ Prisma | BẮT BUỘC | Cao |
| `src/shared/enums/job-status.enum.ts` | Enum trạng thái | Enum string dùng cho lifecycle; helper nhận type enum | BẮT BUỘC | Cao |
| `src/shared/enums/index.ts` | Barrel export | Mỗi shared enum được export tập trung | BẮT BUỘC | Cao |
| `prisma/schema.prisma` | Nguồn schema persistence | Có các Prisma enum như `Gender`, `AuditStatus`, `Visibility`, `JobStatus`, `JobType` và nhiều enum khác | BẮT BUỘC khi enum lưu persistence | Cao |
| `src/domain/entities/job/job.entity.ts` | Entity dùng enum | `JobStatus`/`JobType` là type field, input constructor và so sánh trạng thái | BẮT BUỘC | Cao |
| `src/infrastructure/mappers/job/job.mapper.ts` | Mapper dùng enum | Prisma value được chuyển sang `JobStatus`/`JobType` ở ranh giới Infrastructure | ƯU TIÊN | Cao |

## Điều kiện cần kiểm tra

- Đọc `prisma/schema.prisma`, model dùng enum và migration gần nhất trước mọi enum persistence.
- Đọc entity, mapper, DTO và use case của feature để tìm enum đã có hoặc consumer của enum mới.
- Với status/type/lý do nghiệp vụ, đọc `business-rules` để xác minh giá trị và transition.

## Ranh giới đã xác minh

- `src/shared/enums` là nguồn enum dùng chung cho Domain và Infrastructure.
- Prisma enum là contract persistence; shared enum là contract TypeScript/domain.
- Mapper là ranh giới chuyển Prisma enum sang shared enum; entity không import `@prisma/client`.
