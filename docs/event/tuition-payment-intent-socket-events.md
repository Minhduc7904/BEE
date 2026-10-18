# Tuition payment intent — Socket event contract

## Kết nối và phạm vi

- Socket.IO dùng root namespace: `ws(s)://<API host>/`.
- Client gửi JWT trong Socket.IO handshake theo cơ chế hiện có của ứng dụng. `SocketLifecycleGateway` xác thực JWT và lưu actor ở `client.data.user`.
- Hai loại actor dùng các event bên dưới, danh tính lấy từ JWT (`client.data.user`), không bao giờ nhận `studentId`, `parentId` hoặc room name từ client:
  - **Học sinh** (`studentId`): intent phải thuộc khoản học phí của chính học sinh.
  - **Phụ huynh** (`userType = parent`, `parentId`): intent phải thuộc khoản học phí của học sinh có liên kết `ParentStudent` với phụ huynh. `SocketAuthService.validateToken` trả `parentId` từ JWT.
- Room riêng có dạng `tuition-payment-intent:{paymentIntentId}`. Gateway chỉ join sau khi use case xác minh quyền theo actor ở trên.
- Socket tự rời mọi room khi disconnect. FE nên chủ động unsubscribe khi đóng màn hình thanh toán hoặc đổi intent.
- Lỗi chung phát qua event `error`: `{ message, code?, timestamp }`.

## Bảng event

| Event | Chiều | Sender | Recipient/room | Mục đích |
| --- | --- | --- | --- | --- |
| `tuition-payment:intent:subscribe` | FE → BE | Học sinh/phụ huynh | Gateway | Xác minh quyền rồi join room intent. |
| `tuition-payment:intent:subscribed` | BE → FE | Gateway | Socket đã gửi subscribe | Xác nhận socket đã join room. |
| `tuition-payment:intent:status` | BE → FE | Gateway | Socket đã gửi subscribe | Snapshot trạng thái intent **đọc lại sau khi join**, tránh khoảng trống giữa REST, join và event `paid`. |
| `tuition-payment:intent:unsubscribe` | FE → BE | Học sinh/phụ huynh | Gateway | Rời room intent trên socket hiện tại. |
| `tuition-payment:intent:unsubscribed` | BE → FE | Gateway | Socket đã gửi unsubscribe, hoặc socket của phụ huynh bị thu hồi quyền | Xác nhận đã rời room. Khi thu hồi quyền payload có thêm `reason: 'ACCESS_REVOKED'`. |
| `tuition-payment:intent:paid` | BE → FE | Luồng đối soát | `tuition-payment-intent:{paymentIntentId}` | Báo tuition payment và payment intent đã thanh toán thành công. |

## `tuition-payment:intent:subscribe`

```ts
// FE → BE
{ paymentIntentId: number }

// BE → FE: tuition-payment:intent:subscribed
{ success: true, paymentIntentId: number, timestamp: string }

// BE → FE: tuition-payment:intent:status
{
  success: true,
  intent: {
    paymentIntentId: number,
    tuitionPaymentId: number,
    tuitionPaymentStatus: 'UNPAID' | 'PAID',
    intentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED',
    paidAt: string | null,
    intentUpdatedAt: string
  },
  timestamp: string
}
```

Quy trình của gateway:

1. Xác thực actor và quyền (học sinh: `GetMyTuitionPaymentIntentStatusUseCase`, kiểm tra `tuitionPayment.studentId === client.data.user.studentId`; phụ huynh: `GetParentTuitionPaymentIntentStatusUseCase`, kiểm tra liên kết `ParentStudent`). Intent không tồn tại hoặc không thuộc phạm vi actor thì không join và nhận event `error` với `code = TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED`.
2. Join room.
3. **Đọc lại snapshot sau khi join** rồi mới phát `subscribed` và `status`. Nếu thanh toán commit giữa bước 1 và bước 2, event `paid` đã phát khi socket chưa ở trong room, nhưng snapshot ở bước 3 vẫn là `PAID`. Nếu bước 3 lỗi (ví dụ liên kết vừa bị gỡ), socket rời room.

Client coi `PAID` là trạng thái cuối: mọi snapshot hoặc event `PENDING` đến sau `PAID` phải bị bỏ qua.

### Thu hồi quyền của phụ huynh

Gateway ghi `{ [paymentIntentId]: studentId }` vào `socket.data.tuitionIntentStudents` cho socket phụ huynh. Khi phụ huynh gỡ liên kết học sinh, `UnlinkParentStudentUseCase` gọi `ParentStudentRealtimeRevocationService.revokeStudentAccess`; mọi socket của tài khoản đó rời các room thuộc học sinh bị gỡ và nhận `tuition-payment:intent:unsubscribed` với `reason: 'ACCESS_REVOKED'`. Lỗi thu hồi chỉ được ghi log, không làm hỏng việc gỡ liên kết (REST luôn kiểm tra lại liên kết ở mỗi request).

Giới hạn: việc thu hồi dùng `fetchSockets()` nên chỉ phủ hết các instance khi triển khai nhiều instance với shared Socket.IO adapter. Với một instance (cấu hình hiện tại) không có khoảng trống.

## `tuition-payment:intent:unsubscribe`

```ts
// FE → BE
{ paymentIntentId: number }

// BE → FE: tuition-payment:intent:unsubscribed
{ success: true, paymentIntentId: number, timestamp: string }
```

Unsubscribe chỉ tác động socket hiện tại và không trả dữ liệu intent.

## `tuition-payment:intent:paid`

```ts
// BE → FE
{
  success: true,
  intent: {
    paymentIntentId: 15,
    tuitionPaymentId: 201,
    tuitionPaymentStatus: 'PAID',
    intentStatus: 'PAID',
    paidAt: '2026-07-21T02:15:00.000Z',
    intentUpdatedAt: '2026-07-21T02:15:02.000Z'
  },
  timestamp: '2026-07-21T02:15:03.000Z'
}
```

Event chỉ được phát sau khi transaction đã commit và chỉ khi tuition payment chuyển thành `PAID`:

- Admin xác nhận/đối soát thủ công qua `POST /api/tuition-payments/:id/confirm-manual-payment`.
- Luồng SePay tự động sau khi trang đồng bộ transaction đã commit thành công.

Event có thể bị mất khi socket disconnect hoặc khi hệ thống chạy nhiều instance mà chưa cấu hình Socket.IO adapter chia sẻ. REST snapshot vẫn là nguồn sự thật; sau reconnect FE phải gọi lại REST snapshot rồi subscribe lại.

## Error codes

| Code | Khi nào |
| --- | --- |
| `STUDENT_REQUIRED` | JWT không đại diện cho học sinh. |
| `INVALID_PAYMENT_INTENT_ID` | Payload không có số nguyên dương `paymentIntentId`. |
| `TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED` | Intent không tồn tại, không thuộc học sinh, hoặc không thể đọc trạng thái. |

## Luồng FE đề nghị

1. Gọi `GET /api/tuition-payments/my/{tuitionPaymentId}/payment-intent-status` đúng một lần khi mở màn hình thanh toán để lấy mốc `paymentIntentId` và trạng thái ban đầu.
2. Kết nối Socket.IO bằng JWT, lắng nghe `tuition-payment:intent:status` và `tuition-payment:intent:paid` trước khi emit subscribe.
3. Emit `tuition-payment:intent:subscribe` với `paymentIntentId`. Dùng event `status` trả về ngay sau join để bù race condition với REST snapshot.
4. Sau đó cập nhật UI từ event `paid`; không polling API định kỳ.
5. Khi reconnect hoặc nghi ngờ mất event, lặp lại bước 1–3. Khi rời màn hình, emit unsubscribe.
