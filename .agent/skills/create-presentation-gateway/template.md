# Mẫu Gateway và tài liệu Socket Event

## 1. Mẫu Gateway

Thay `<Feature>`, `<feature>`, event constant, DTO, permission và use case bằng thành phần thật. Đọc `BaseGateway` trước khi chọn room/response.

```ts
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets'
import { UseGuards } from '@nestjs/common'
import { Socket } from 'socket.io'
import { BaseGateway } from './base.gateway'
import { SocketAuthService } from '../../infrastructure/services/socket/socket-auth.service'
import { SocketService } from '../../infrastructure/services/socket/socket.service'
import { SocketRoomService } from '../../infrastructure/services/socket/socket-room.service'
import { <Feature>UseCase } from '../../application/use-cases/<feature>'
import { SOCKET_EVENTS } from '../../shared/constants/socket-events.constant'
import { RequireWsPermissions } from '../../shared/decorators/ws-permissions.decorator'
import { WsPermissionsGuard } from '../../shared/guards/ws-permissions.guard'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

type <Feature>Payload = {
  resourceId: number
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class <Feature>Gateway extends BaseGateway {
  constructor(
    socketService: SocketService,
    socketAuthService: SocketAuthService,
    socketRoomService: SocketRoomService,
    private readonly <feature>UseCase: <Feature>UseCase,
  ) {
    super(socketService, socketAuthService, socketRoomService)
  }

  @UseGuards(WsPermissionsGuard) // Chỉ giữ khi command thực sự cần permission.
  @RequireWsPermissions(PERMISSION_CODES.<FEATURE>.<ACTION>)
  @SubscribeMessage(SOCKET_EVENTS.<FEATURE>.<ACTION>)
  async handle<Action>(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: <Feature>Payload,
  ): Promise<void> {
    const user = this.getUser(client)
    if (!user) {
      this.emitError(client, 'Yêu cầu đăng nhập', 'UNAUTHORIZED')
      return
    }

    // Validate payload bằng cơ chế DTO/WS đã được dự án cấu hình.
    // Ownership và business rule nằm trong use case.
    try {
      const result = await this.<feature>UseCase.execute(payload.resourceId, user.userId)
      if (!result.success) {
        this.emitError(client, result.message || 'Không thể thực hiện thao tác', '<ACTION>_FAILED')
        return
      }

      this.emitSuccess(client, SOCKET_EVENTS.<FEATURE>.<ACTION>_COMPLETED, {
        result: result.data,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định'
      this.emitError(client, message, '<ACTION>_FAILED')
    }
  }

  private get<Resource>Room(resourceId: number): string {
    return `<feature>:${resourceId}`
  }
}
```

Nếu event thành công phải tới mọi tab của user, thay `emitSuccess` bằng `this.socketService.emitToUser(user.userId, event, payload)`. Chỉ dùng `emitToRoom` sau khi toàn bộ socket trong room đã được server authorize.

## 2. Mẫu tài liệu `docs/event/<feature>-socket-events.md`

```md
# <Feature> — Socket Event Contract

## Kết nối và phạm vi

- Socket.IO URL/namespace: `<URL hoặc root namespace>`.
- Authentication: JWT trong handshake; `BaseGateway` xác thực và gắn `client.data.user`.
- Actor: `<student | admin | user>`.
- Room: `user:{userId}` được tự join; `<feature>:{resourceId}` chỉ join sau ownership check.
- Error chung: event `error` với `{ message, code?, timestamp }`.

## Bảng event

| Event | Chiều | Sender | Recipient/room | Mục đích |
| --- | --- | --- | --- | --- |
| `<feature>:<action>` | `FE → BE` | `<actor>` | Gateway | `<command>` |
| `<feature>:<action>:completed` | `BE → FE` | Gateway/service | `user:{userId}` | `<kết quả>` |

## `<feature>:<action>`

| Thuộc tính | Giá trị |
| --- | --- |
| Chiều | `FE → BE` |
| Actor/quyền | `<actor và permission nếu có>` |
| Ownership | `<use case xác minh thế nào>` |
| Use case | `<UseCase>` |

```ts
// FE → BE input
{ resourceId: number }

// BE → FE success: <feature>:<action>:completed
{ success: true, result: unknown, timestamp: string }

// BE → FE error: error
{ message: string, code?: string, timestamp: string }
```

| Error code | Khi nào |
| --- | --- |
| `UNAUTHORIZED` | Không có JWT/user hợp lệ. |
| `<ACTION>_FAILED` | Use case hoặc input bị từ chối. |

## Luồng FE

1. Kết nối Socket bằng JWT handshake.
2. `<Phát event command hoặc subscribe>`.
3. Chỉ cập nhật UI khi nhận event thành công; khi reconnect, `<gọi snapshot API hoặc subscribe lại>`.
```

## 3. Mẫu bảng thay đổi tài liệu

Khi sửa event hiện có, cập nhật lại event cũ trong tài liệu cùng lúc và ghi rõ thay đổi tương thích:

| Thay đổi | Ảnh hưởng FE | Cách chuyển đổi |
| --- | --- | --- |
| `<đổi input/output/room/event>` | `<màn hình/client bị ảnh hưởng>` | `<phiên bản hoặc bước FE cần làm>` |
