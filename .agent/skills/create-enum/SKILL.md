---
name: create-enum
description: Tạo hoặc cập nhật shared enum cho BEE. Dùng khi một field có status, type, visibility hoặc tập giá trị hữu hạn cần được dùng nhất quán trong Prisma, Domain Entity và mapper.
---

# Viết enum cho BEE

## Mục tiêu

Định nghĩa một nguồn giá trị hữu hạn dùng chung tại `src/shared/enums/`; entity và mapper phải dùng enum đó thay vì `string`, number, literal rời rạc hoặc `any`.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước.
2. Đọc [template.md](template.md) trước khi tạo enum.
3. Đọc `business-rules` khi enum là trạng thái hoặc lý do nghiệp vụ.
4. Đọc toàn bộ `database-schema-changes` trước khi enum được lưu trong Prisma hoặc enum Prisma phải thay đổi.
5. Đọc `create-domain-entity` và `create-prisma-mapper` khi enum được dùng bởi entity/mapper.

## Quy trình

1. Xác nhận field thực sự có tập giá trị hữu hạn và tìm enum đã có trong `src/shared/enums` trước. Tái sử dụng enum phù hợp; không tạo bản trùng lặp.
2. Xác minh tên, từng giá trị, ý nghĩa, default, trạng thái hợp lệ và ảnh hưởng dữ liệu cũ. Không bịa lifecycle hoặc giá trị status.
3. Nếu enum được lưu persistence, kiểm tra enum/model liên quan trong `prisma/schema.prisma` và làm theo `database-schema-changes`, gồm migration, kiểm tra SQL và Prisma generate.
4. Tạo `src/shared/enums/<name>.enum.ts` theo [template.md](template.md), dùng enum PascalCase và value UPPER_SNAKE_CASE ổn định, trùng chính xác Prisma enum khi có.
5. Thêm export vào `src/shared/enums/index.ts`.
6. Cập nhật entity để import shared enum và khai báo field/constructor/method bằng enum; cập nhật mapper để import enum và chuyển giá trị Prisma về enum chỉ sau khi xác minh hai bộ giá trị đồng bộ.
7. Cập nhật DTO validation, filter/sort hoặc API documentation nếu enum là input/output công khai và mô-đun hiện có yêu cầu.
8. Chạy lệnh xác minh phù hợp.

## Guardrail

- Không tạo enum khi boolean, string tự do, ID hoặc dữ liệu mở mới là mô hình đúng.
- Không sao chép enum chỉ khác tên hoặc đặt giá trị kinh doanh chưa được phê duyệt.
- Không dùng numeric enum; dùng string value ổn định để đồng bộ Prisma, API và dữ liệu cũ.
- Không dùng Prisma enum trực tiếp trong Domain; Domain dùng shared enum.
- Không sửa/đổi tên/xóa giá trị enum Prisma đã triển khai nếu chưa có migration và kế hoạch tương thích dữ liệu.
- Không dùng `as any`; chỉ dùng cast enum ở ranh giới mapper sau khi xác minh value parity.

## Xác minh

- Với enum chỉ ở TypeScript: chạy `npm run build`.
- Với enum Prisma: theo `database-schema-changes`, gồm `npm run prisma:migrate:status`, migration, kiểm tra SQL, `npm run prisma:generate`, `npm run build` và migration status.
- Không bắt buộc tạo hoặc chạy unit test, integration test hay coverage.
- Báo cáo trung thực lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Đã tìm enum có sẵn trước khi tạo mới.
- [ ] Mỗi value có ý nghĩa nghiệp vụ được xác minh.
- [ ] Enum được export từ `src/shared/enums/index.ts`.
- [ ] Entity và mapper dùng shared enum khi field là tập giá trị hữu hạn.
- [ ] Enum Prisma và shared enum đồng bộ nếu field được lưu persistence.
- [ ] Không có yêu cầu unit test.
