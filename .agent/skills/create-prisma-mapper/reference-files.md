# Tệp tham chiếu cho `create-prisma-mapper`

Đọc entity, schema và repository của feature trước; bảng sau là bằng chứng quy ước mapper hiện có của BEE.

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/infrastructure/mappers/user/user.mapper.ts` | Mapper user | Lớp static dùng `toDomainUser`/`toDomainUsers`; repository trả entity sau khi gọi mapper | BẮT BUỘC | Cao |
| `src/infrastructure/mappers/verification/email-verification-token.mapper.ts` | Mapper nhỏ | Input null trả null; mapping danh sách gọi lại hàm mapping đơn | BẮT BUỘC | Cao |
| `src/infrastructure/mappers/subject/subject.mapper.ts` | Mapper có relation | Tách mapping cơ bản và mapping record có relation | ƯU TIÊN | Cao |
| `src/infrastructure/mappers/exam/exam.mapper.ts` | Mapper relation phức tạp | Relation đã tải được chuyển qua mapper của entity liên quan | ƯU TIÊN | Cao |
| `src/infrastructure/mappers/subject/subject.mapper.ts` | Mã cũ | Dùng `any` và truyền relation Prisma thô vào entity | KHÔNG ĐƯỢC LẶP LẠI | Cao |
| `src/infrastructure/mappers/exam/exam.mapper.ts` | Mã cũ | Dùng `any`/`as any` để ép type | KHÔNG ĐƯỢC LẶP LẠI | Cao |
| `src/infrastructure/mappers/job/job.mapper.ts` | Mapper có enum | Import `JobStatus`/`JobType` từ shared và chuyển Prisma value về enum trước khi khởi tạo entity | ƯU TIÊN | Cao |
| `src/shared/enums/job-status.enum.ts` | Shared enum | Giá trị enum dùng string ổn định, có `Record<JobStatus, string>` cho nhãn | BẮT BUỘC | Cao |

## Tệp cần đọc theo tình huống

- `prisma/schema.prisma` để xác nhận model, nullability và relation.
- Entity đích để xác nhận constructor input và optional property.
- Prisma repository gọi mapper để xác nhận `select`/`include` và nơi gọi mapper.
- Mapper của relation để tránh raw relation, circular mapping và độ sâu không cần thiết.
- `create-enum` để xác minh shared enum và Prisma enum tương ứng có cùng giá trị trước khi cast ở mapper.

## Ranh giới đã xác minh

- Prisma repository query/persist rồi gọi mapper trước khi trả entity domain.
- Mapper ở Infrastructure có thể import Prisma type và domain entity.
- Domain không biết Prisma; mapper không biết HTTP, use case, authorization hoặc transaction.
- Field có tập giá trị hữu hạn phải được mapper chuyển về shared enum trước khi vào entity.
