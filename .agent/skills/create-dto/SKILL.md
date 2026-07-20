---
name: create-dto
description: Tạo hoặc cập nhật request, query và response DTO cho BEE. Dùng khi định nghĩa input/output API, phân trang hoặc filter; mọi field input phải ưu tiên dùng validation decorator trong src/shared/decorators/validate.
---

# Viết DTO cho BEE

## Mục tiêu

Đặt DTO tại `src/application/dtos/<feature>/` để xác thực hình dạng request, biểu diễn query/response và giữ HTTP controller mỏng. DTO không chứa query database, authorization hoặc business rule.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước khi tạo hoặc sửa DTO.
2. Đọc [template.md](template.md) trước khi tạo DTO.
3. Đọc `create-enum` khi DTO có status, type, visibility hoặc tập giá trị hữu hạn.
4. Đọc `create-validate-decorator` trước khi tạo validation decorator mới.
5. Đọc `business-rules` khi thay đổi input ảnh hưởng ownership, state transition, policy hoặc business error.

## Quy trình

1. Xác định DTO là request, update, query/list hay response; không dùng cùng một class cho các contract có field/quyền khác nhau.
2. Đọc DTO và controller gần nhất; với list, đọc `ListQueryDto` và whitelist sort field theo feature.
3. Với mọi field input, kiểm tra toàn bộ `src/shared/decorators/validate` và dùng decorator phù hợp (`IsRequiredString`, `IsOptionalInt`, `IsRequiredEnumValue`, ...).
4. Nếu không có decorator phù hợp, đọc toàn bộ skill `create-validate-decorator` trước, rồi mới tạo decorator dùng chung. Không lặp lại chuỗi decorator thô trong nhiều DTO.
5. Dùng shared enum và `IsRequiredEnumValue`/`IsOptionalEnumValue` cho field có tập giá trị hữu hạn; không dùng `string` thay enum.
6. Dùng class-validator/custom decorator để kiểm tra cấu trúc, kiểu, required/optional, giới hạn và chuyển đổi input. Đặt validation liên trường, quyền và kiểm tra database trong use case.
7. Với response DTO, map tường minh từ entity bằng `from<Entity>`/`from<Entity>List` nếu mô-đun gần nhất dùng mẫu đó; không trả Prisma record.
8. Cập nhật barrel export khi thư mục DTO hiện có dùng `index.ts`, sau đó chạy `npm run build`.

## Guardrail

- Không viết raw `@IsString`, `@IsEnum`, `@IsInt`, transform lặp lại trong DTO khi decorator tương ứng đã có ở `src/shared/decorators/validate`.
- Không nhận ownership field từ request self-service khi có thể lấy từ `@CurrentUser`.
- List DTO phải mở rộng `ListQueryDto`; sort client phải được whitelist trước khi thành pagination/domain option.
- Không import Prisma, repository adapter, `PrismaService`, controller hoặc HTTP response vào DTO.
- Không chứa transaction, query database, permission check hoặc business state transition trong DTO.
- Không dùng `any` cho request/response shape mới.

## Xác minh

- Chạy `npm run build` sau thay đổi TypeScript.
- Không bắt buộc tạo hoặc chạy unit test, integration test hay coverage.
- Báo cáo trung thực lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Đã đọc `reference-files.md` và `template.md`.
- [ ] Mọi field input dùng validation decorator phù hợp.
- [ ] Khi không có decorator phù hợp, đã đọc `create-validate-decorator` trước khi tạo decorator mới.
- [ ] Field hữu hạn dùng shared enum và enum decorator.
- [ ] List DTO extends `ListQueryDto` và whitelist sort field khi có sort.
- [ ] DTO không chứa Prisma, database query, authorization hay business rule.
- [ ] Không có yêu cầu unit test.
