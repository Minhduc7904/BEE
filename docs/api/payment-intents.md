# Payment Intents API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Permission cho cả hai API: `payment-intent:create`.
- Hai API tạo `PaymentIntent` cho học phí cũ đủ điều kiện chưa có intent, bất kể luồng sau đó dùng bank tự động hay manual fallback; chưa tạo `PaymentAttempt` hoặc QR. Học phí tạo mới qua các API `tuition-payments` đã có intent ngay trong transaction tạo học phí.
- Mọi intent mới đều ghi audit log theo admin thực hiện. Gọi lại cho một học phí đã có intent trả lại intent cũ, không tạo bản ghi hay audit trùng.

## Điều kiện tạo bắt buộc

Backend luôn kiểm tra dữ liệu hiện tại trong cùng transaction. Các endpoint này là luồng backfill/idempotent cho dữ liệu cũ:

1. `TuitionPayment` ở trạng thái `UNPAID` và có `amount > 0`.

`PaymentIntent` là nghĩa vụ thanh toán độc lập với cách thu tiền. Việc chọn bank mapping tự động hoặc default manual, cũng như tạo `PaymentAttempt`/QR, diễn ra ở API payment instruction sau đó. Vì vậy configuration/bank đang manual fallback không ngăn tạo intent.

`expiresAt: null` nghĩa là intent không giới hạn thời gian. Chỉ intent có `expiresAt` là thời điểm cụ thể mới chuyển `EXPIRED` khi thời điểm kiểm tra đã tới hoặc qua thời điểm đó.

## Kiểu dữ liệu PaymentIntent

```json
{
  "paymentIntentId": 15,
  "tuitionPaymentId": 201,
  "amount": 1200000,
  "currency": "VND",
  "status": "PENDING",
  "expiresAt": null,
  "createdAt": "2026-07-20T08:00:00.000Z",
  "updatedAt": "2026-07-20T08:00:00.000Z"
}
```

## `POST /api/admin/payment-intents/tuition-payments/:tuitionPaymentId`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `payment-intent:create` |
| Status thành công | `201 Created` |
| Side effect | Tạo intent và audit `CREATE_PAYMENT_INTENT`; nếu intent đã tồn tại thì trả bản ghi hiện tại, không tạo audit giả. |

`tuitionPaymentId` là số nguyên dương. Không có request body.

Response khi tạo mới:

```json
{
  "success": true,
  "message": "Tạo payment intent cho học phí thành công",
  "data": {
    "created": true,
    "paymentIntent": { "paymentIntentId": 15, "tuitionPaymentId": 201, "amount": 1200000, "currency": "VND", "status": "PENDING" }
  }
}
```

## `POST /api/admin/payment-intents/tuition-payments/bulk`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `payment-intent:create` |
| Status thành công | `201 Created` |
| Side effect | Tạo và audit từng intent mới của khối/kỳ được yêu cầu. |

Body:

```json
{
  "grade": 7,
  "month": 8,
  "year": 2026
}
```

`grade` từ 1 đến 12, `month` từ 1 đến 12, `year >= 2000`.

API tìm tất cả học phí `UNPAID` của học sinh thuộc khối đó, đúng tháng/năm và `amount > 0`. Intent đã tồn tại được bỏ qua và tính vào `existingPaymentIntentCount`.

```json
{
  "success": true,
  "message": "Tạo payment intent theo khối và kỳ học thành công",
  "data": {
    "totalEligible": 42,
    "created": [{ "paymentIntentId": 15, "tuitionPaymentId": 201, "amount": 1200000, "currency": "VND", "status": "PENDING" }],
    "existingPaymentIntentCount": 3
  }
}
```

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Body batch không hợp lệ hoặc học phí không có số tiền dương. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu quyền `payment-intent:create`. |
| `404` | Không có tuition payment. |
| `422` | Tuition payment cụ thể không còn ở trạng thái `UNPAID`. |
