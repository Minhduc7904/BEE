# Tệp tham chiếu cho `write-project-aware-skill`

Đọc các tệp sau trước khi tạo hoặc cập nhật skill. Chỉ ghi quy tắc dự án vào skill mới khi đã kiểm tra tệp hoặc mô-đun liên quan.

| Tệp | Khi phải đọc | Quy ước xác minh |
|---|---|---|
| `AGENTS.md` | Mọi tác vụ | GitNexus impact analysis trước khi sửa symbol; không commit khi chưa phát hiện phạm vi thay đổi. |
| `.agent/skills/shared/architecture.md` | Mọi tác vụ | NestJS + Prisma; hướng dependency `presentation → application → domain ← infrastructure`. |
| `.agent/skills/shared/clean-architecture-rules.md` | Mọi tác vụ | Domain/Application không gọi Prisma trực tiếp; mapper/repository ở Infrastructure. |
| `.agent/skills/business-rules/SKILL.md` | Ownership, validation, state transition, policy, business error | Không bịa business rule; use case chịu trách nhiệm điều phối rule liên mô hình. |
| `.agent/skills/database-schema-changes/SKILL.md` | Prisma schema, migration, bảng, cột, enum, relation, index | Không dùng `prisma db push`; kiểm tra migration SQL và generate Prisma. |
| `.agent/skills/create-enum/SKILL.md` | Status, type, visibility hoặc tập giá trị hữu hạn | Tái sử dụng shared enum, đồng bộ enum Prisma khi field được lưu persistence, và export từ `src/shared/enums/index.ts`. |
| `.agent/skills/create-dto/SKILL.md` | Request, query hoặc response DTO | Input DTO tái sử dụng validation decorator; list DTO mở rộng `ListQueryDto` và whitelist sort field. |
| `.agent/skills/create-validate-decorator/SKILL.md` | Validation/transform decorator dùng lại trong DTO | Kiểm tra toàn bộ `src/shared/decorators/validate` trước; chỉ tạo decorator mới khi chưa có decorator phù hợp. |
| `.agent/skills/create-prisma-repository/SKILL.md` | Domain repository port, Prisma repository, relation options hoặc DI | Dùng options relation có cờ cụ thể, mặc định không tải relation; không để Application truyền Prisma `include`. |
| `.agent/skills/create-application-use-case/SKILL.md` | Get/list/detail, create/update/delete, pagination, Unit of Work và audit log quản trị | Use repository qua `UNIT_OF_WORK`, relation options tường minh và audit mutation quản trị bằng enum/constants dùng chung. |
| `.agent/skills/create-presentation-controller/SKILL.md` | Route/controller, DTO HTTP, permission, CurrentUser, response status và đăng ký PresentationModule | Controller chỉ gắn HTTP contract, gọi use case qua ExceptionHandler và không chứa Prisma/business rule/audit log. |
| `.agent/skills/business-rules/tuition-payment-sepay-business-rules/SKILL.md` | Khoản thu học phí, payment core, VietQR, webhook SePay, đối soát và notification | Tách PaymentIntent/PaymentAttempt/BankTransferTransaction khỏi aggregate nghiệp vụ; chống trùng theo provider transaction ID và xác thực HMAC raw body. |
| `.agent/skills/business-rules/write-business-rule-skill/SKILL.md` | Tạo business skill mới | Bắt buộc có luồng BE, FE client, FE admin, API dự kiến và thiết kế schema tối thiểu. |
| `package.json` | Khi nêu lệnh xác minh | Chỉ dùng command đã được khai báo trong scripts. |

## Cách ghi bằng chứng cho skill mới

Trong `reference-files.md` của skill mới, dùng bảng sau và chỉ liệt kê tệp đã đọc:

```md
| Tệp tham chiếu | Vai trò | Quy ước trích xuất | Phân loại | Độ tin cậy |
|---|---|---|---|---|
| `src/...` | `<vai trò>` | `<quy ước>` | `<BẮT BUỘC/ƯU TIÊN/CŨ/...>` | `<Cao/Trung bình>` |
```

Ghi rõ giả định chưa xác minh là `ƯU TIÊN`; không biến technical debt thành quy tắc bắt buộc.
