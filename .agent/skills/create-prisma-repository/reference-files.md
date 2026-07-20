# Tệp tham chiếu cho `create-prisma-repository`

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/domain/repositories/question.repository.ts` | Domain port question | Port khai báo input/filter/pagination và relation options; không phụ thuộc Prisma | ƯU TIÊN | Cao |
| `src/infrastructure/repositories/exam/prisma-question.repository.ts` | Repository tham chiếu do người dùng nêu | Query Prisma, mapper và option relation hiện hữu | THAM CHIẾU CẦN CẢI TIẾN | Cao |
| `src/infrastructure/repositories/exam/prisma-question.repository.ts` | Mã cũ relation options | `includeRelations` mặc định tải nhiều relation; `any` và include nặng ở list query | KHÔNG ĐƯỢC LẶP LẠI | Cao |
| `src/infrastructure/repositories/media/prisma-seo-media-item.repository.ts` | Repository có options cụ thể | `includeSlot?: boolean`, `buildInclude(options)` và mặc định không include relation | BẮT BUỘC | Cao |
| `src/domain/repositories/seo-media-item.repository.ts` | Domain port options cụ thể | Options relation là contract domain, không lộ Prisma include | BẮT BUỘC | Cao |
| `src/infrastructure/mappers/media/seo-media-item.mapper.ts` | Mapper option-aware | Mapper chỉ map relation khi option bật | ƯU TIÊN; `any` trong mapper là mã cũ | Cao |
| `src/infrastructure/infrastructure.module.ts` | DI composition root | Repository Prisma được đăng ký với token `I<Feature>Repository` | BẮT BUỘC | Cao |

## Hướng dẫn lựa chọn relation

| Nhu cầu | Cách làm |
|---|---|
| Một relation tùy chọn, dùng ở vài caller | Thêm `include<Relation>?: boolean` vào options và `buildInclude`. |
| Nhiều relation tùy chọn độc lập | Thêm cờ riêng cho từng relation; không dùng `includeRelations` tổng quát. |
| Một detail view luôn cần cùng một graph relation | Cân nhắc method rõ nghĩa như `findByIdWithDetail` thay vì nhiều cờ. |
| List/pagination | Mặc định không include relation nặng; chỉ thêm relation cần cho response hiện tại. |
| Relation cần sort/filter/select riêng | Giữ cấu hình Prisma trong `buildInclude`, không để caller gửi object Prisma. |

## Tệp cần đọc theo tình huống

- Entity, mapper, schema và use case caller của feature.
- `create-prisma-mapper` khi relation mới phải được map.
- `database-schema-changes` khi relation/filter cần schema hoặc index mới.
- `InfrastructureModule` khi thêm token/provider repository.

## Ranh giới đã xác minh

- Domain chỉ biết repository interface/options/result type; Infrastructure biết Prisma.
- Repository gọi mapper trước khi trả entity.
- Options relation là contract có kiểu tường minh, không phải Prisma include công khai.
