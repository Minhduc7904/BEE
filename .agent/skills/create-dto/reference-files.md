# Tệp tham chiếu cho `create-dto`

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/application/dtos/subject/subject.dto.ts` | Create/update/response DTO | Request dùng `IsRequiredString`/`IsOptionalString`; response map từ entity bằng static factory | BẮT BUỘC | Cao |
| `src/application/dtos/pagination/list-query.dto.ts` | Base list DTO | Query chung có pagination, sort, date filter và dùng validation decorator | BẮT BUỘC cho list DTO | Cao |
| `src/application/dtos/subject/subject-list-query.dto.ts` | Feature list DTO | Extends `ListQueryDto`, dùng decorator và whitelist sort field trước khi trả pagination option | BẮT BUỘC | Cao |
| `src/application/dtos/tuition-payment/create-tuition-payment.dto.ts` | Request có enum | Field enum dùng shared enum và `IsRequiredEnumValue` | BẮT BUỘC | Cao |
| `src/shared/decorators/validate/index.ts` | Public validation API | DTO import decorator từ `src/shared/decorators/validate` | BẮT BUỘC | Cao |

## Tệp cần đọc theo tình huống

- Toàn bộ `src/shared/decorators/validate/` trước khi chọn hoặc tạo decorator.
- `create-validate-decorator` trước mọi decorator mới.
- `create-enum` và `src/shared/enums/` khi DTO có field hữu hạn.
- Controller và use case gần nhất để xác nhận ownership, input/output và permission.

## Ranh giới đã xác minh

- DTO xác thực request shape, không kiểm tra database hoặc rule nghiệp vụ.
- Use case xử lý validation liên trường và business rule.
- Response DTO nhận domain entity, không nhận Prisma record.
