---
name: write-project-aware-skill
description: Tạo hoặc cập nhật skill cho BEE từ mã nguồn thật, kiến trúc Clean Architecture và quy ước đã xác minh. Dùng khi cần chuẩn hóa một loại công việc thành gói gồm SKILL.md, template.md và reference-files.md.
---

# Viết skill am hiểu dự án BEE

## Mục tiêu

Tạo skill tái sử dụng, phù hợp với BEE và có đúng ba tệp:

```text
<skill-name>/
├── SKILL.md
├── template.md
└── reference-files.md
```

- `SKILL.md` là điểm vào, chứa phạm vi, quy trình, guardrail và chỉ dẫn đọc hai tệp còn lại.
- `template.md` là khung có thể điền lại cho artefact hoặc skill mà tác vụ tạo ra.
- `reference-files.md` là danh sách tệp đã đọc, bằng chứng quy ước, phân loại legacy và các tệp bắt buộc phải đọc khi dùng skill.

Không tạo thêm tệp hoặc thư mục trong gói skill, trừ khi người dùng yêu cầu rõ ràng.

## Ngôn ngữ

- Viết mọi giải thích và ví dụ bằng tiếng Việt có dấu.
- Giữ nguyên đường dẫn, lệnh, mã nguồn và identifier kỹ thuật bằng tiếng Anh.
- Không dùng tiếng Việt không dấu.

## Phải đọc trước khi soạn skill

1. `AGENTS.md`.
2. `.agent/skills/shared/architecture.md`.
3. `.agent/skills/shared/clean-architecture-rules.md`.
4. `reference-files.md` của skill đang tạo/cập nhật, nếu tệp đã có.
5. Các skill chuyên biệt và mô-đun gần nhất được chỉ ra trong yêu cầu.

Đọc `business-rules` khi có hành vi nghiệp vụ; đọc `business-rules/tuition-payment-sepay-business-rules` khi liên quan khoản thu học phí, payment core, VietQR, webhook SePay hoặc đối soát; đọc `business-rules/write-business-rule-skill` khi cần tạo/cập nhật business skill; đọc `database-schema-changes` khi liên quan schema/migration; đọc `create-application-use-case` khi liên quan API/Application; đọc `create-presentation-controller` khi liên quan route, controller, permission, HTTP decorator hoặc actor hiện hành; đọc `create-presentation-gateway` khi liên quan Socket event, room hoặc realtime contract; đọc `create-infrastructure-service` khi thêm/sửa external service, application port, DI provider hoặc config environment; đọc `create-enum` khi field có status, type, visibility hoặc một tập giá trị hữu hạn; đọc `create-dto` khi liên quan request/query/response DTO; đọc `create-validate-decorator` trước khi tạo validation decorator mới; đọc `create-prisma-repository` khi thêm/sửa domain repository port, Prisma repository, relation options hoặc DI repository. Nếu khám phá mã nguồn lạ, dùng GitNexus. Trước khi skill yêu cầu sửa function, class hoặc method, phải nhắc chạy GitNexus impact analysis theo `AGENTS.md`.

## Quy trình

1. Xác định trách nhiệm duy nhất, trigger, đầu ra và phần ngoài phạm vi của skill.
2. Đọc mô-đun BEE gần nhất, lần theo luồng liên quan và chọn ít nhất hai ví dụ khỏe mạnh nếu có.
3. Đối chiếu với Clean Architecture: `presentation → application → domain ← infrastructure`.
4. Phân loại mọi mẫu được dùng làm bằng chứng là `BẮT BUỘC`, `ƯU TIÊN`, `TÙY NGỮ CẢNH`, `CŨ` hoặc `KHÔNG ĐƯỢC LẶP LẠI`.
5. Ghi tệp đã đọc, quy ước trích xuất, phân loại và độ tin cậy vào `reference-files.md`.
6. Viết `SKILL.md` theo [template.md](template.md), chỉ giữ workflow và guardrail cần thiết; liên kết trực tiếp đến hai tệp còn lại.
7. Hoàn thiện `template.md` bằng khung có placeholder rõ nghĩa, không gắn cứng một feature hoặc business rule chưa xác minh.
8. Xác minh cả ba tệp tồn tại, các đường dẫn là thật, tiếng Việt có dấu, và không có yêu cầu unit test.

## Ranh giới kiến trúc BEE

- Domain không phụ thuộc NestJS, Prisma, HTTP hoặc Infrastructure.
- Application dùng domain ports/entities, không gọi Prisma trực tiếp.
- Infrastructure triển khai port và chứa mapper/repository Prisma.
- Presentation chỉ xử lý route, DTO, auth/permission và gọi use case.
- Use case dùng `execute`; mapper chuyển Prisma record thành domain entity; controller dùng `ExceptionHandler.execute` khi phù hợp.
- Entity và mapper phải dùng shared enum hiện có cho tập giá trị hữu hạn; không thay enum bằng `string`, number, literal rời rạc hoặc `any`.

Chỉ đưa quy tắc vào skill khi chúng liên quan đến trách nhiệm của skill và có bằng chứng trong `reference-files.md`.

## Xác minh

- Không yêu cầu tạo hoặc chạy unit test, integration test hay coverage.
- Chỉ đề xuất lệnh đã xác minh trong `package.json` và phù hợp phạm vi, như `npm run build` cho TypeScript hoặc Prisma generate/migration khi sửa schema.
- Báo cáo trung thực lệnh đã chạy, chưa chạy và lý do.

## Checklist cuối

- [ ] Gói có đúng `SKILL.md`, `template.md` và `reference-files.md`.
- [ ] `SKILL.md` liên kết trực tiếp và nêu khi nào đọc hai tệp còn lại.
- [ ] `reference-files.md` chỉ chứa bằng chứng đã đọc hoặc giả định được ghi rõ.
- [ ] `template.md` có thể tái sử dụng, không chứa business rule bịa đặt.
- [ ] Dependency direction của BEE được bảo toàn.
- [ ] Không yêu cầu unit test.
- [ ] Tiếng Việt có dấu và command/đường dẫn đã xác minh.
