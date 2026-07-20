---
name: write-business-rule-skill
description: Viết hoặc cập nhật business-rule skill cho BEE. Dùng khi cần tài liệu hóa một luồng nghiệp vụ mới có actor, state transition, API dự kiến, thiết kế bảng/enum/relation/index và luồng phối hợp rõ ràng giữa BE, FE client và FE admin trước khi code.
---

# Viết Business-Rule Skill

## Mục tiêu

Tạo skill hướng dẫn thiết kế nghiệp vụ trước khi hiện thực. Mỗi business skill phải trả lời rõ:

1. Ai làm gì và trên dữ liệu nào?
2. Điều kiện nào được chấp nhận hoặc từ chối?
3. BE xử lý theo thứ tự nào, transaction nào cần atomic?
4. FE client thấy/làm gì, FE admin vận hành/giải quyết gì?
5. API nào cần có, bảo vệ bởi actor/permission nào?
6. Bảng, enum, relation và index nào cần thay đổi tối thiểu?

Mỗi skill phải có đúng ba tệp: `SKILL.md`, `template.md`, `reference-files.md`. Dùng tiếng Việt có dấu. Không tạo README, script, assets, unit test template hoặc tệp phụ.

## Trước khi viết skill

1. Đọc `.agent/skills/shared/architecture.md` và `clean-architecture-rules.md`.
2. Đọc `.agent/skills/business-rules/SKILL.md`, các skill chuyên biệt liên quan và module gần nhất.
3. Nếu có schema, enum, bảng, relation hoặc migration, đọc `database-schema-changes` trước khi đề xuất.
4. Nếu luồng dùng đối tác bên ngoài, đọc tài liệu chính thức mới nhất và ghi link trực tiếp trong `reference-files.md`.
5. Không tự bịa policy còn thiếu; đưa nó vào mục “Quyết định cần chốt”.

## Cấu trúc bắt buộc của business skill

### Trong `SKILL.md`

- Phạm vi và glossary ngắn.
- Actor, ownership và state transition.
- Luồng BE từng bước, điểm transaction, event/audit/notification.
- Luồng FE client và FE admin tách riêng; ghi “không áp dụng” nếu actor không tồn tại.
- Guardrail và checklist hiện thực.

### Trong `template.md`

- Sequence hoặc flow giữa FE client, FE admin, BE và external provider khi có.
- Bảng API dự kiến: method/path, actor, input DTO, response, permission, side effect.
- Bảng schema: bảng/field/enum/relation/index và lý do nghiệp vụ.
- Ma trận state transition, rejection và trường hợp biên.
- Danh sách quyết định cần product/business owner chốt.

### Trong `reference-files.md`

- Mã nguồn BEE cần đối chiếu theo mục đích.
- Skill liên quan.
- Link tài liệu chính thức của bên thứ ba khi có.
- Cảnh báo dữ liệu cũ, migration/backfill, privacy/security hoặc ambiguity.

## Cách mô tả luồng

### Luồng BE

Mỗi bước phải nêu actor/trigger, input tin cậy, use case chịu trách nhiệm, repository/transaction, transition, side effect và cách xử lý lỗi. Không mô tả controller hoặc Prisma là nơi chứa business rule.

### Luồng FE client

Nêu màn hình/hành động client, API được gọi, dữ liệu BE là nguồn sự thật, loading/error/pending state và cách nhận kết quả. FE không tự suy trạng thái nghiệp vụ, tự sinh mã bảo mật, tự đổi amount hoặc tự xác nhận payment.

### Luồng FE admin

Nêu tạo/cập nhật/vận hành, danh sách/filter, dashboard ngoại lệ, quyền theo action, audit và manual resolution. Tách rõ thao tác quản trị khỏi self-service.

## Quy tắc API dự kiến

Với từng API, luôn ghi:

- method và path, có phân biệt route static/param;
- actor và cơ chế bảo vệ (`RequirePermission`, self-service auth hoặc machine-to-machine verification);
- input DTO/query/param và response DTO;
- use case chịu trách nhiệm và side effect;
- status/error nghiệp vụ thấy được;
- quyền mới cần thêm và role seed nếu có.

Webhook/callback bên thứ ba không dùng permission JWT như user API; phải nêu cơ chế chữ ký, idempotency, timeout và reconciliation.

## Quy tắc thiết kế bảng

1. Bắt đầu từ bảng/aggregate hiện có; ưu tiên thêm field/relation nhỏ thay vì tạo bảng hoặc duplicate data.
2. Tạo bảng mới khi dữ liệu có lifecycle, audit, retention, query hoặc idempotency riêng.
3. Mỗi bảng/field mới phải có purpose, ownership, optionality, relation/onDelete, enum/status, query/index và policy dữ liệu cũ.
4. Không dùng polymorphic `type/id` làm liên kết duy nhất khi có thể dùng FK typed; nếu phải dùng, nêu validation application layer.
5. Thiết kế enum theo lifecycle thực tế; không thêm status “để sau này có thể cần”.
6. Không đề xuất migration thực thi, thay đổi code hay unit test khi user chỉ yêu cầu skill; nêu migration/backfill cần thiết như kế hoạch.

## Checklist cuối

- [ ] Có luồng BE, FE client và FE admin rõ ràng.
- [ ] API có actor, DTO, permission và side effect.
- [ ] Schema có bảng/field/enum/relation/index kèm lý do.
- [ ] State transition, audit, notification, idempotency và lỗi được nêu khi liên quan.
- [ ] Các giả định/rule chưa chốt được tách thành câu hỏi.
- [ ] Skill có đúng ba tệp và không yêu cầu unit test.
