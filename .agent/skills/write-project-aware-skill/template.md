# Mẫu tạo skill cho BEE

Thay toàn bộ phần trong `<...>` bằng thông tin đã xác minh. Giữ đúng ba tệp trong gói skill.

```md
---
name: <skill-name>
description: <Skill làm gì và dùng khi nào, bằng tiếng Việt có dấu.>
---

# <Tên skill>

## Mục tiêu và phạm vi

Hướng dẫn <trách nhiệm tái sử dụng>.

Ngoài phạm vi: <những việc thuộc skill khác>.

## Tệp phải đọc

1. Đọc [reference-files.md](reference-files.md) trước để biết bằng chứng và tệp nguồn.
2. Đọc [template.md](template.md) trước khi tạo artefact từ mẫu.
3. Đọc <skill/tệp bắt buộc khác> khi <điều kiện>.

## Quy trình

1. <Bước quan sát được đầu tiên.>
2. <Bước tạo hoặc cập nhật artefact.>
3. <Bước kiểm tra kiến trúc/DI/schema/permission khi liên quan.>
4. <Bước xác minh.>

## Guardrail

- <Dependency hoặc business boundary không được vi phạm.>
- Không bịa quy tắc, đường dẫn, command hoặc mã lỗi.
- Không bắt buộc tạo hoặc chạy unit test.

## Xác minh

- Chạy `<command đã xác minh>` khi phù hợp.
- Báo cáo lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Đã đọc `reference-files.md` và các tệp liên quan.
- [ ] Đã dùng đúng mẫu trong `template.md`.
- [ ] Không vi phạm kiến trúc BEE.
- [ ] Không có yêu cầu unit test.
```
