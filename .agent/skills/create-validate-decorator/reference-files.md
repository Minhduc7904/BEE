# Tệp tham chiếu cho `create-validate-decorator`

| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/shared/decorators/validate/index.ts` | Barrel export | Mọi validation decorator dùng chung được export tập trung | BẮT BUỘC | Cao |
| `src/shared/decorators/validate/string.decorator.ts` | Decorator chuỗi | Cặp `IsOptional...`/`IsRequired...` dùng `applyDecorators`, transform và `VALIDATION_MESSAGES` | BẮT BUỘC | Cao |
| `src/shared/decorators/validate/number.decorator.ts` | Decorator số | Required/optional kết hợp `ToNumber`, class-validator và giới hạn min/max có message chuẩn | BẮT BUỘC | Cao |
| `src/shared/decorators/validate/enum.decorator.ts` | Decorator enum | Tái sử dụng `IsEnumValue` qua `IsRequiredEnumValue`/`IsOptionalEnumValue` | BẮT BUỘC | Cao |
| `src/shared/decorators/is-enum-value.decorator.ts` | Custom validator cũ | Dùng `registerDecorator` khi wrapper class-validator không đủ; `any` là mã cũ không được lặp lại | KHÔNG ĐƯỢC LẶP LẠI | Cao |
| `src/application/dtos/tuition-payment/create-tuition-payment.dto.ts` | DTO consumer enum | DTO dùng validation decorator từ shared thay vì raw class-validator | ƯU TIÊN | Cao |

## Tệp cần đọc theo tình huống

- Toàn bộ `src/shared/decorators/validate/` trước khi tạo decorator mới.
- DTO consumer để xác minh input, transform, required/optional và label.
- `src/shared/constants` để tái sử dụng `VALIDATION_MESSAGES`.
- `create-enum` khi decorator liên quan enum.

## Ranh giới đã xác minh

- Decorator xác thực hoặc chuẩn hóa một property DTO, không truy vấn dữ liệu hay kiểm tra business rule.
- DTO dùng decorator từ `src/shared/decorators/validate`.
- Use case chịu trách nhiệm validation liên trường, quyền và nghiệp vụ.
