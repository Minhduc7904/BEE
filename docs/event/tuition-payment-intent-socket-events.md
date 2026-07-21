# Tuition payment intent — Socket event contract

## Kết nối và phạm vi

- Socket.IO dùng root namespace: `ws(s)://<API host>/`.
- Client gửi JWT trong Socket.IO handshake theo cơ chế hiện có của ứng dụng. `BaseGateway` xác thực JWT và lưu actor ở `client.data.user`.
- Chỉ actor có `studentId` mới dùng các event bên dưới. Không truyền `studentId` hoặc room name từ client.
- Room riêng có dạng `tuition-payment-intent:{paymentIntentId}`. Gateway chỉ join sau khi use case xác minh intent thuộc tuition payment của học sinh đang đăng nhập.
- Socket tự rời mọi room khi disconnect. FE nên chủ động unsubscribe khi đóng màn hình thanh toán hoặc đổi intent.
- Lỗi chung phát qua event `error`: `{ message, code?, timestamp }`.

## Bảng event

| Event | Chiều | Sender | Recipient/room | Mục đích |
| --- | --- | --- | --- | --- |
| `tuition-payment:intent:subscribe` | FE → BE | Học sinh | Gateway | Xác minh ownership rồi join room intent. |
| `tuition-payment:intent:subscribed` | BE → FE | Gateway | Socket đã gửi subscribe | Xác nhận socket đã join room. |
| `tuition-payment:intent:status` | BE → FE | Gateway | Socket đã gửi subscribe | Snapshot trạng thái intent ngay sau khi join, tránh khoảng trống giữa REST và subscribe. |
| `tuition-payment:intent:unsubscribe` | FE → BE | Học sinh | Gateway | Rời room intent trên socket hiện tại. |
| `tuition-payment:intent:unsubscribed` | BE → FE | Gateway | Socket đã gửi unsubscribe | Xác nhận đã rời room. |
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

Gateway truy vấn trạng thái hiện tại bằng `GetMyTuitionPaymentIntentStatusUseCase`, kiểm tra `tuitionPayment.studentId === client.data.user.studentId`, sau đó mới join room. Intent không tồn tại hoặc thuộc học sinh khác không được join.

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
