---
name: create-validate-decorator
description: Tạo hoặc cập nhật validation decorator dùng chung cho DTO của BEE. Dùng khi đã kiểm tra src/shared/decorators/validate và không có decorator phù hợp để tái sử dụng cho validation hoặc chuyển đổi input.
---

# Viết validation decorator cho BEE

## Mục tiêu

Tạo decorator tái sử dụng tại `src/shared/decorators/validate/` để DTO có validation và chuyển đổi input nhất quán, thông báo lỗi theo chuẩn BEE.

Chỉ tạo decorator mới khi đã kiểm tra toàn bộ thư mục `src/shared/decorators/validate/` và xác nhận không có decorator phù hợp.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước.
2. Đọc [template.md](template.md) trước khi tạo decorator.
3. Đọc toàn bộ `src/shared/decorators/validate/` và `index.ts` để tránh trùng lặp.
4. Đọc `create-enum` nếu decorator xác thực enum.
5. Đọc `create-dto` để xác nhận DTO consumer, required/optional và thông điệp cần dùng.

## Quy trình

1. Xác định validation chỉ liên quan một field và có thể tái sử dụng qua nhiều DTO. Nếu cần database, actor, ownership, nhiều field hoặc state transition, không tạo decorator; đặt rule ở use case.
2. Tìm decorator hiện có theo kiểu dữ liệu, required/optional, transform và giới hạn. Tái sử dụng hoặc mở rộng decorator đó nếu phù hợp.
3. Đọc DTO consumer thật để xác nhận input HTTP cần transform gì, field là required hay optional, label tiếng Việt và lỗi mong muốn.
4. Tạo `<category>.decorator.ts` tại `src/shared/decorators/validate/`, dùng named function theo mẫu `IsRequired...` hoặc `IsOptional...`.
5. Ghép `class-validator` và transform có sẵn qua `applyDecorators`; dùng `VALIDATION_MESSAGES` cho thông báo. Required/optional phải nhất quán với cặp decorator hiện có.
6. Dùng `registerDecorator` chỉ khi class-validator không thể diễn đạt quy tắc một-field; dùng kiểu cụ thể, không dùng `any` trong decorator mới.
7. Export decorator từ `src/shared/decorators/validate/index.ts` và thay các chuỗi decorator trùng lặp trong DTO có liên quan nếu phạm vi thay đổi cho phép.
8. Chạy `npm run build`.

## Guardrail

- Không tạo decorator chỉ là bản sao đổi tên của decorator hiện có.
- Không để decorator gọi database, Prisma, repository, service ngoài, request context hoặc DI.
- Không đặt business rule, permission, ownership, trạng thái hoặc validation liên trường trong decorator.
- Không hard-code tên feature/business rule; truyền `label`, enum, giới hạn hoặc option qua tham số.
- Không dùng raw `@IsEnum`, `@IsString`, `@IsInt` trong DTO mới khi decorator dùng chung phù hợp đã tồn tại.
- Không dùng `any` hoặc `as any` để làm decorator compile được.

## Xác minh

- Chạy `npm run build` sau thay đổi TypeScript.
- Không bắt buộc tạo hoặc chạy unit test, integration test hay coverage.
- Báo cáo trung thực lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Đã kiểm tra toàn bộ `src/shared/decorators/validate/` trước khi tạo mới.
- [ ] Decorator mới là quy tắc một-field, tái sử dụng được và có tham số cần thiết.
- [ ] Dùng `applyDecorators`, transform và `VALIDATION_MESSAGES` theo quy ước.
- [ ] Đã export từ `src/shared/decorators/validate/index.ts`.
- [ ] Không có database, business rule, permission hoặc `any`.
- [ ] Không có yêu cầu unit test.
