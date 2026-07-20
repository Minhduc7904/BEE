---
name: create-domain-entity
description: Tạo hoặc cập nhật Domain Entity cho BEE theo Clean Architecture. Dùng khi thêm thuộc tính, quan hệ domain hoặc hành vi nội tại cho một khái niệm nghiệp vụ; không dùng cho Prisma model, DTO hay mapper.
---

# Viết Domain Entity cho BEE

## Mục tiêu

Tạo entity domain thuần TypeScript tại `src/domain/entities/`, chứa trạng thái và hành vi nội tại của một khái niệm nghiệp vụ.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước khi thiết kế hoặc sửa entity.
2. Đọc [template.md](template.md) trước khi tạo lớp mới.
3. Đọc `create-enum` trước khi thêm/sửa field có status, type, visibility hoặc tập giá trị hữu hạn.
4. Đọc `business-rules` khi có ownership, validation nghiệp vụ, state transition hoặc policy.
5. Đọc `database-schema-changes` trước khi thay đổi Prisma schema.

## Quy trình

1. Xác định định danh, field bắt buộc/tùy chọn, relation và hành vi được yêu cầu; không tự đặt business rule có rủi ro cao.
2. Đọc entity, repository port và mapper gần nhất nêu trong `reference-files.md`.
3. Nếu sửa class/method hiện có, chạy GitNexus impact analysis theo `AGENTS.md` trước khi sửa.
4. Với mỗi field có tập giá trị hữu hạn, tìm shared enum trong `src/shared/enums` trước. Dùng enum hiện có; chỉ tạo enum mới theo `create-enum` khi chưa có enum phù hợp.
5. Tạo hoặc cập nhật entity theo [template.md](template.md), dùng type cụ thể và constructor nhận object dữ liệu.
6. Đặt hành vi nội tại đã xác minh vào method domain; so sánh trạng thái qua member enum, không dùng string literal.
7. Cập nhật barrel export nếu mô-đun hiện có dùng nó. Không cần DI registration cho entity thuần.
8. Chạy `npm run build` sau thay đổi TypeScript.

## Guardrail kiến trúc

- Chỉ import domain entity khác hoặc enum/type thuần không phụ thuộc framework.
- Không import NestJS, Prisma, DTO, mapper, repository adapter, HTTP hoặc service ngoài.
- Không có `fromPrisma`, `toPrisma`, query database hoặc response serialization trong entity.
- Không dùng `any` cho property, constructor hoặc relation.
- Field có status, type, visibility hoặc tập giá trị hữu hạn phải dùng shared enum đã có; không khai báo `string`, number hay union literal để thay thế enum.
- Không đặt transaction hoặc authorization vào entity.

## Xác minh

- Không bắt buộc tạo hoặc chạy unit test, integration test hay coverage.
- Khi đổi schema, theo toàn bộ quy trình của `database-schema-changes`.
- Báo cáo trung thực lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Đã đọc `reference-files.md` và `template.md`.
- [ ] Entity không phụ thuộc Prisma, NestJS, HTTP hoặc Infrastructure.
- [ ] Constructor, field và relation có kiểu tường minh.
- [ ] Field có tập giá trị hữu hạn đã dùng shared enum hoặc đã tạo enum mới theo `create-enum`.
- [ ] Hành vi domain chỉ phản ánh rule đã xác minh.
- [ ] Không có yêu cầu unit test.
