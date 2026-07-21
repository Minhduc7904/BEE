# SEO Tuition Payment Intent — Socket Event Contract

- Namespace: `/seo`.
- Không yêu cầu JWT handshake.
- Mọi subscribe/unsubscribe bắt buộc payload `{ studentId, parentPhone, paymentIntentId }`.
- Gateway kiểm tra `parentPhone` đúng với student và `paymentIntentId` thuộc student đó trước khi join/rời room.
- Room: `tuition-payment-intent:{paymentIntentId}` trong namespace `/seo`.

## Events

| Event                                 | Chiều   | Quy tắc                                                 |
| ------------------------------------- | ------- | ------------------------------------------------------- |
| `tuition-payment:intent:subscribe`    | FE → BE | Chỉ emit sau REST status xác nhận intent chưa `PAID`.   |
| `tuition-payment:intent:subscribed`   | BE → FE | Xác nhận socket đã vào room.                            |
| `tuition-payment:intent:status`       | BE → FE | Snapshot trạng thái ngay sau subscribe.                 |
| `tuition-payment:intent:paid`         | BE → FE | Được phát sau commit khi tuition payment chuyển `PAID`. |
| `tuition-payment:intent:unsubscribe`  | FE → BE | Emit khi đã PAID, rời trang hoặc đổi intent.            |
| `tuition-payment:intent:unsubscribed` | BE → FE | Xác nhận socket đã rời room.                            |
| `error`                               | BE → FE | Envelope `{ message, code, timestamp }`.                |

```ts
type SeoPaymentIntentSocketPayload = {
  studentId: number
  parentPhone: string
  paymentIntentId: number
}
```

FE phải gọi REST status khi connect/reconnect, sau đó chỉ subscribe nếu intent chưa `PAID`. Khi nhận `intent:status` hoặc `intent:paid` có trạng thái `PAID`, FE xóa QR và emit unsubscribe ngay.

Lỗi `INVALID_PAYMENT_INTENT_ID`, `TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED` hoặc `TUITION_PAYMENT_INTENT_UNSUBSCRIBE_FAILED` không được retry mù quáng; FE gọi lại REST status để đồng bộ trước.
