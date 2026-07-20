---
name: create-presentation-gateway
description: Viết hoặc cập nhật NestJS Socket.IO Gateway cho BEE. Dùng khi thêm event WebSocket, room, xác thực Socket JWT, quyền WebSocket, đồng bộ realtime, gọi use case qua Gateway hoặc phát event BE → FE; luôn cập nhật đầy đủ contract tại docs/event.
---

# Viết Presentation Gateway

## Mục tiêu

Đặt Gateway tại `src/presentation/gateways/<feature>.gateway.ts`. Gateway là lớp Presentation: nhận Socket event, lấy user đã xác thực, áp dụng quyền, gọi application use case và phát response/event. Không đặt Prisma query, repository, mapper, transaction hoặc business rule vào Gateway.

Mỗi thay đổi Gateway phải cập nhật tài liệu tương ứng tại `docs/event/`, nêu đầy đủ chiều `FE → BE` hoặc `BE → FE`, endpoint Socket, authentication, room/recipient, input, output, error code và ví dụ payload. Đọc `template.md` để viết tài liệu và `reference-files.md` để chọn mẫu dự án.

## Tệp phải đọc trước khi thực hiện

1. Đọc `template.md` và `reference-files.md` của skill này.
2. Đọc `base.gateway.ts`, `socket.service.ts`, `socket-room.service.ts`, `socket-events.constant.ts`.
3. Đọc `notification.gateway.ts` và `competition.gateway.ts`; dùng Competition làm mẫu chính cho room riêng và event contract. Không lặp lại `join-room` tự do của Notification cho tài nguyên nhạy cảm.
4. Đọc use case, DTO và business rule mà event gọi; đọc `create-application-use-case`, `create-dto`, `business-rules` khi phù hợp.
5. Khi sửa class/handler Gateway hiện có, chạy GitNexus impact analysis trước khi sửa.

## Quy trình

1. Xác định event là command `FE → BE`, notification/state update `BE → FE`, hay cả hai; xác định actor, ownership, use case, room recipient và dữ liệu nhạy cảm.
2. Định nghĩa tên mới trong `SOCKET_EVENTS` theo namespace feature, không dùng string literal rải rác. Command dùng động từ hiện tại, output dùng kết quả quá khứ, ví dụ `competition:attempt:answer:save` → `competition:attempt:answer:saved`.
3. Kế thừa `BaseGateway`, inject `SocketService`, `SocketAuthService`, `SocketRoomService` rồi inject use case cần thiết. Không inject Prisma/repository/mapper/Unit of Work.
4. Dùng `@SubscribeMessage()` cho command client; nhận `@ConnectedSocket() client` và `@MessageBody() payload`. Lấy actor từ `this.getUser(client)`, không nhận `userId`, `studentId`, `adminId` hoặc owner từ payload.
5. Với action cần permission, gắn `@UseGuards(WsPermissionsGuard)` và `@RequireWsPermissions(...)`. Dùng constant permission nếu dự án đã có; guard hiện tại có semantics OR khi truyền nhiều quyền.
6. Kiểm tra payload shape theo DTO/validation đã được cấu hình. Không giả định HTTP `ValidationPipe` tự áp dụng cho Socket; nếu chưa có cơ chế validate WS, dừng để thiết kế nó thay vì tự kiểm tra tản mạn trong từng handler.
7. Dùng `emitSuccess` hoặc `SocketService.emitToUser`/`emitToRoom` theo recipient. Dùng `emitError(client, message, code)` cho lỗi đã xử lý; payload lỗi chuẩn là `{ message, code, timestamp }`.
8. Chỉ join room riêng sau khi use case hoặc rule ownership đã xác minh resource. Không cho client truyền room ID tùy ý đối với payment, bài làm, hồ sơ, lớp hoặc dữ liệu quản trị.
9. Đăng ký/export Gateway ở `PresentationModule` theo convention hiện có.
10. Trước khi bàn giao, tạo/cập nhật đúng tài liệu `docs/event/<feature>-socket-events.md` theo mẫu; mô tả mọi event thêm, sửa hoặc bỏ dùng.

## Room và bảo mật

- `BaseGateway` xác thực JWT ở handshake, lưu user trong `client.data.user` và tự join `user:{userId}`.
- Base hiện join role/user type qua `joinRoleRoom`, nên room thực tế có dạng `role:<role>`, ví dụ `role:admin`; không tự giả định room `admin` từ helper chưa được join.
- Room resource phải có dạng có chủ đích, ví dụ `competition-submit:{submitId}`; đặt helper private để sinh room, không ghép chuỗi lặp lại ở nhiều handler.
- Dùng `emitToUser` cho kết quả riêng tư trên mọi tab/thiết bị của một user; dùng `emitToRoom` chỉ khi toàn bộ thành viên room đã được authorize.
- Không broadcast dữ liệu cá nhân. Không gửi raw payload, secret, đáp án đúng, permission, token hoặc field không cần thiết tới FE.
- Socket là channel realtime, không thay thế nguồn sự thật database/use case. Với reconnect hoặc event có thể mất, cung cấp snapshot API/event subscribe có ownership rõ ràng và ghi vào docs.

## Quy ước response

Command thành công dùng envelope hiện có:

```ts
{
  success: true,
  // dữ liệu event,
  timestamp: string,
}
```

Lỗi nghiệp vụ/validation trả qua event `error`:

```ts
{ message: string; code?: string; timestamp: string }
```

Không tạo ACK callback, envelope khác hoặc event `...:error` riêng nếu chưa có lý do contract rõ ràng và chưa được ghi tài liệu. Khi phát state update cho nhiều tab, cân nhắc `eventId`/`version` theo business rule để FE loại event trùng/cũ.

## Tài liệu bắt buộc tại docs/event

Với Gateway mới, tạo `docs/event/<feature>-socket-events.md` nếu chưa có tài liệu feature. Với Gateway/event đã có, cập nhật tài liệu hiện hữu; không tạo tài liệu trùng nội dung. Mỗi tài liệu phải có:

1. URL/namespace Socket.IO, cách gửi JWT handshake, actor được phép và room tự join/room riêng.
2. Bảng event tổng quan: tên event, chiều `FE → BE`/`BE → FE`, sender, recipient/room, mục đích.
3. Với từng command: payload input đầy đủ, validation/ownership/permission, use case, output thành công, event lỗi và error code.
4. Với từng event server phát: trigger sau commit, payload output đầy đủ, room/recipient, trường hợp FE phải refetch/reconnect.
5. Ví dụ JSON/TypeScript cho input và output; nêu field optional, enum và không gửi field nhạy cảm.
6. Luồng sequence khi feature có từ ba bước hoặc có REST phối hợp Socket; ghi rõ event legacy/deprecated nếu tồn tại.

## Điều không được làm

- Không bỏ qua xác thực BaseGateway hoặc tin actor/room/ownership từ client payload.
- Không cho client self-join room nhạy cảm chỉ bằng `roomId`.
- Không truy cập Prisma/repository trực tiếp hoặc nhét state transition vào Gateway.
- Không phát kết quả mutation trước khi use case/transaction hoàn tất.
- Không thêm/sửa/bỏ event mà không cập nhật `docs/event` với chiều, input, output và error contract.
- Không yêu cầu unit test trong giai đoạn hiện tại; khi hiện thực, kiểm tra thủ công bằng Socket client và build/typecheck phù hợp.

## Checklist

- [ ] Gateway kế thừa `BaseGateway`, actor lấy từ socket đã xác thực.
- [ ] Event mới dùng `SOCKET_EVENTS`; permission/ownership/room đúng scope.
- [ ] Gateway chỉ gọi use case; không có Prisma/repository/business rule.
- [ ] Success/error payload theo envelope hiện có và không rò rỉ dữ liệu nhạy cảm.
- [ ] Room riêng chỉ được join sau authorization; recipient đã xác định.
- [ ] Gateway được đăng ký/export ở `PresentationModule`.
- [ ] `docs/event` mô tả chính xác từng event `FE → BE`/`BE → FE`, input, output và error.
- [ ] Không thêm yêu cầu unit test.
