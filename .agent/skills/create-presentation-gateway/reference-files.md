# Tài liệu tham chiếu cho Presentation Gateway

## Mẫu Gateway đã đối chiếu

| Tệp | Phân loại | Quy ước rút ra |
| --- | --- | --- |
| `src/presentation/gateways/base.gateway.ts` | BẮT BUỘC | Xác thực JWT handshake, `client.data.user`, user room, base success/error envelope và lifecycle Gateway. |
| `src/presentation/gateways/competition.gateway.ts` | BẮT BUỘC | Gateway gọi use case, lấy `studentId` từ user, room riêng theo resource, emit tới room/user và event constant. |
| `src/presentation/gateways/notification.gateway.ts` | TÙY NGỮ CẢNH/CŨ | Mẫu `WsPermissionsGuard`, `RequireWsPermissions`, `emitSuccess`/`emitError`; `join-room`/`leave-room` tự do không áp dụng cho dữ liệu nhạy cảm mới. |
| `src/infrastructure/services/socket/socket.service.ts` | BẮT BUỘC | `emitToUser`, `emitToRoom`, `broadcast`, join/leave room. |
| `src/infrastructure/services/socket/socket-room.service.ts` | BẮT BUỘC | Convention `user:{id}`, `role:{role}`, helper room và lưu ý `getAdminRoom()` không tự được BaseGateway join. |
| `src/shared/constants/socket-events.constant.ts` | BẮT BUỘC | Mọi event mới cần khai báo tập trung theo feature. |
| `src/shared/decorators/ws-permissions.decorator.ts` | BẮT BUỘC khi event cần quyền | Metadata permission cho handler. |
| `src/shared/guards/ws-permissions.guard.ts` | BẮT BUỘC khi event cần quyền | JWT user, SUPER_ADMIN bypass, nhiều permission là OR. |
| `src/presentation/presentation.module.ts` | BẮT BUỘC | Đăng ký và export Gateway. |
| `docs/COMPETITION-SOCKET-EVENT-FLOW.md` | BẮT BUỘC | Mẫu tài liệu event chi tiết: chiều, room, input/output, lỗi, luồng FE và phạm vi chưa triển khai. |

## Tài liệu cần cập nhật

- Gateway mới hoặc event feature mới: tạo `docs/event/<feature>-socket-events.md`.
- Sửa event/input/output/room/quyền đã có: cập nhật chính file event của feature; ghi migration/deprecation nếu FE cần đổi.
- Thư mục `docs/event/` đã tồn tại. Không viết contract Socket mới chỉ trong comment code hoặc message bàn giao.

## Tệp liên quan theo nhu cầu

| Nhu cầu | Đọc thêm |
| --- | --- |
| Event gọi use case | `.agent/skills/create-application-use-case/SKILL.md`, use case và DTO thực tế. |
| Ownership, trạng thái hoặc notification | `.agent/skills/business-rules/SKILL.md` và business skill feature nếu có. |
| Payload DTO/enum | `.agent/skills/create-dto/SKILL.md`, `.agent/skills/create-enum/SKILL.md`. |
| Sửa handler/class đã tồn tại | GitNexus impact analysis theo `AGENTS.md`. |

## Điều phải xác minh trước khi code

1. JWT handshake hiện tạo `user:{userId}` và role room nào cho actor thực tế?
2. Room resource có được join sau ownership check chưa, hay cần use case subscribe riêng?
3. Event là command, response trực tiếp, state update hay notification; có cần `eventId`/`version` để chống trùng không?
4. Cơ chế validation WebSocket có thực sự áp dụng DTO không?
5. FE cần snapshot REST/re-subscribe nào khi reconnect?
