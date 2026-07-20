# Tệp tham chiếu cho `create-domain-entity`

Đọc các tệp này trước khi tạo hoặc sửa entity. Các quy ước dưới đây chỉ áp dụng khi phù hợp với mô-đun đang làm.

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/domain/entities/user.entity.ts` | Entity người dùng | Lớp TypeScript có constructor object, field bắt buộc/tùy chọn và method domain | BẮT BUỘC | Cao |
| `src/domain/entities/token/email-verification-token.entity.ts` | Entity token nhỏ | Hành vi `isExpired`, `isConsumed`, `canBeUsed` nằm trong entity | BẮT BUỘC | Cao |
| `src/domain/entities/log/admin-audit-log.entity.ts` | Entity có enum/relation | Relation là domain entity tùy chọn; enum đến từ shared | ƯU TIÊN | Cao |
| `src/domain/entities/job/job.entity.ts` | Entity có trạng thái/type | `JobStatus` và `JobType` được import từ `src/shared/enums` và dùng trong field, constructor, method transition | BẮT BUỘC | Cao |
| `src/shared/enums/index.ts` | Barrel export enum | Shared enum được export tập trung để entity import từ `../../../shared/enums` | BẮT BUỘC | Cao |
| `src/domain/entities/subject/subject.entity.ts` | Mã cũ | Có `fromPrisma`, `any`, relation thô và `toJSON` | KHÔNG ĐƯỢC LẶP LẠI | Cao |
| `src/domain/entities/chapter/chapter.entity.ts` | Mã cũ | Có chuyển đổi Prisma và serialize API trong entity | KHÔNG ĐƯỢC LẶP LẠI | Cao |

## Tệp cần đọc theo tình huống

- Entity, repository port và mapper gần nhất của chính feature.
- `prisma/schema.prisma` cùng `database-schema-changes` nếu field/relation cần đổi.
- `create-enum` trước khi thêm/sửa status, type, visibility hoặc tập giá trị hữu hạn.
- Use case và `business-rules` nếu method mới liên quan state transition, ownership hoặc policy.

## Ranh giới đã xác minh

- Entity ở Domain không import framework, Prisma, HTTP hay Infrastructure.
- Mapper ở Infrastructure chuyển Prisma record thành entity.
- Response API được tạo bởi Application DTO, không phải `toJSON` của entity.
