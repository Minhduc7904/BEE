---
name: business-rules
description: Xác định, ghi nhận và áp dụng business rule cho BEE. Dùng khi thêm hoặc sửa hành vi nghiệp vụ, ownership, validation liên trường, state transition, chính sách xóa, hạn mức, thanh toán, audit, notification hoặc quy tắc xử lý lỗi.
---

# Business Rules

## Phạm vi

Skill này là nguồn hướng dẫn cho quy tắc nghiệp vụ. Rule nằm tại application use case; DTO chỉ validate cấu trúc request, repository chỉ truy vấn/lưu dữ liệu và controller chỉ xử lý HTTP/authentication/permission.

Đọc `template.md` để viết rule theo biểu mẫu và `reference-files.md` để chọn skill/mã nguồn liên quan. Với học phí, VietQR, webhook SePay hoặc payment core, đọc thêm `tuition-payment-sepay-business-rules/SKILL.md`. Khi tạo một business skill mới, đọc `write-business-rule-skill/SKILL.md`.

## Trước khi thiết kế

1. Đọc architecture và clean architecture rules.
2. Xác định actor, aggregate sở hữu dữ liệu, trạng thái hiện có và nguồn sự thật của rule.
3. Không tự bịa policy chưa được phê duyệt. Với quyền, dữ liệu cũ, tiền, điểm, trạng thái hoặc external provider, tách rõ giả định và quyết định cần chốt.
4. Đọc `database-schema-changes` nếu rule cần bảng, field, enum, relation, index hoặc migration.
5. Chạy GitNexus impact analysis trước khi sửa code đang tồn tại.

## Cách định nghĩa rule

Với mỗi rule, nêu rõ actor/scope, input tin cậy, precondition, transition/outcome, rejection, audit/notification và retention/xóa khi liên quan. Luồng có client/admin/provider phải mô tả rõ trách nhiệm của từng bên; frontend không là nguồn sự thật của state nghiệp vụ.

## Khi hiện thực

1. Chuyển rule thành use case có transition tường minh.
2. Kiểm tra ownership và precondition trước khi đọc/sửa/xóa.
3. Dùng Unit of Work khi rule thay đổi nhiều aggregate, cần audit hoặc cần atomicity.
4. Cập nhật API/DTO/permission/schema theo skill tương ứng.
5. Không bắt buộc viết unit test vì dự án hiện chưa có luồng này; chạy build/typecheck phù hợp sau thay đổi code.

## Checklist

- [ ] Actor, ownership, precondition và rejection rõ ràng.
- [ ] State transition và side effect được nêu.
- [ ] Rule không nằm ở controller/repository/DTO.
- [ ] API, permission, schema và dữ liệu cũ đã được đánh giá khi có tác động.
- [ ] Giả định chưa chốt được chuyển thành quyết định cần xác nhận.
