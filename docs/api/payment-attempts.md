# Payment Attempts API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: học sinh đã đăng nhập bằng Bearer JWT. `studentId` luôn lấy từ JWT; API không nhận `studentId` từ client.
- Ba endpoint dùng `@RequirePermission()` để yêu cầu xác thực. Học sinh chỉ đọc/làm mới/hủy attempt của học phí thuộc chính mình.
- Endpoint lấy hướng dẫn là `GET /api/tuition-payments/my/:id/payment-instructions`, nhưng được quản lý bởi `PaymentAttemptController`.

## Quy tắc tạo hoặc dùng lại giao dịch

1. Học phí phải thuộc học sinh hiện tại, `UNPAID` và có `amount > 0`.
2. Học phí mới đã có `PaymentIntent` từ API tạo học phí. Với dữ liệu cũ chưa có intent, endpoint này vẫn tự tạo intent `PENDING`; intent đã tồn tại phải còn `PENDING`. `PaymentIntent.expiresAt = null` nghĩa là vô hạn, không phải đã hết hạn.
3. Nếu intent có `PaymentAttempt` `PENDING` còn **ít nhất 60 giây**, API lấy hướng dẫn trả lại chính attempt đó; không tạo attempt mới. URL QR được dựng lại với nội dung chuyển khoản chuẩn nếu bản QR cũ dùng nội dung cũ. `PaymentAttempt.expiresAt` luôn có giá trị, không có QR vô hạn.
4. Attempt `PENDING` đã hết hạn hoặc chỉ còn **dưới 60 giây** được chuyển `EXPIRED`, với `expiresAt` đặt thành thời điểm hiện tại trừ `1` giây, rồi hệ thống tạo attempt/QR mới trong cùng transaction. Thời hạn attempt mới lấy từ `SEPAY_ATTEMPT_EXPIRY_MINUTES`, mặc định `30` phút.
5. Cấu hình thu `MANUAL_FALLBACK` luôn dùng bank manual mặc định với `confirmationMode: MANUAL_FALLBACK`.
6. Cấu hình `AUTOMATIC` chỉ dùng bank mapping theo khối với `confirmationMode: AUTOMATIC` khi mapping có bank, bank `status: ACTIVE` và `sepayStatus: ACTIVE`. Thiếu một trong các điều kiện này thì tự động chuyển sang bank manual mặc định và `MANUAL_FALLBACK`.
7. Bank manual mặc định phải tồn tại và `status: ACTIVE` trong mọi trường hợp.

## `GET /api/tuition-payments/my/:id/payment-instructions`

| Thuộc tính | Giá trị |
| --- | --- |
| Xác thực | Student Bearer JWT |
| Status thành công | `200 OK` |
| Side effect | Tạo `PaymentAttempt` khi chưa có attempt dùng được hoặc attempt gần hết hạn; chỉ tạo `PaymentIntent` khi xử lý dữ liệu cũ chưa có intent. Attempt cũ được thay thế bị đánh dấu `EXPIRED`. |

`id` là `tuitionPaymentId` nguyên dương. Không có request body.

```json
{
  "success": true,
  "message": "Lấy hướng dẫn thanh toán học phí thành công",
  "data": {
    "tuitionPaymentId": 201,
    "paymentIntentId": 15,
    "paymentAttemptId": 42,
    "attemptCode": "HP7A82F",
    "amount": 1200000,
    "currency": "VND",
    "transferContent": "HP7A82F TP201 HSNGUYEN VAN A 0901234567",
    "qrCodeUrl": "https://qr.sepay.vn/img?...",
    "expiresAt": "2026-07-20T08:30:00.000Z",
    "status": "PENDING",
    "bankSelectionSource": "GRADE_MAPPING",
    "confirmationMode": "AUTOMATIC",
    "receivingBankAccount": {
      "receivingBankAccountId": 1,
      "bankCode": "MB",
      "accountNumber": "0123456789",
      "accountHolder": "TRUNG TÂM BEE",
      "displayName": "Tài khoản thu học phí"
    }
  }
}
```

`transferContent` luôn bắt đầu bằng `attemptCode`, sau đó là `TP<tuitionPaymentId>`, `HS<tên học sinh>` không dấu theo đúng thứ tự `lastName + firstName` và số điện thoại phụ huynh chỉ gồm chữ số nếu có. Các phần cách nhau bằng một dấu cách, không dùng `|` hay `:`. Webhook SePay chỉ auto-match theo `attemptCode`, account nhận và amount; các phần còn lại hỗ trợ người chuyển tiền/đối soát.

## `POST /api/tuition-payments/my/:id/payment-instructions/refresh`

| Thuộc tính | Giá trị |
| --- | --- |
| Xác thực | Student Bearer JWT |
| Status thành công | `200 OK` |
| Request body | Không có |
| Side effect | Hết hạn toàn bộ attempt `PENDING` cũ của payment intent và tạo attempt/QR mới trong cùng transaction. |

`id` là `tuitionPaymentId` nguyên dương. Endpoint chỉ dùng khi học sinh chủ động cần mã QR mới; khác với `GET payment-instructions`, endpoint này **không** tái sử dụng QR cũ dù attempt còn thời hạn.

```http
POST /api/tuition-payments/my/201/payment-instructions/refresh
Authorization: Bearer <student-jwt>
```

Response là `BaseResponseDto<PaymentInstructionResponseDto>` có đúng shape của endpoint GET, nhưng `paymentAttemptId`, `attemptCode`, `qrCodeUrl` và `expiresAt` là của attempt mới. Attempt cũ được cập nhật `status: EXPIRED` và `expiresAt` thành thời điểm refresh trừ một giây, nên QR/mã cũ không còn được auto-match.

## `POST /api/tuition-payments/my/:tuitionPaymentId/payment-attempts/:paymentAttemptId/cancel`

| Thuộc tính | Giá trị |
| --- | --- |
| Xác thực | Student Bearer JWT |
| Status thành công | `200 OK` |
| Side effect | Đổi attempt `PENDING` thành `CANCELLED` và đặt `expiresAt` bằng thời điểm hủy. |

Không có request body. Cả học phí và attempt phải thuộc cùng một `PaymentIntent` của học sinh hiện tại.

```json
{
  "success": true,
  "message": "Hủy giao dịch thanh toán thành công",
  "data": {
    "paymentAttemptId": 42,
    "status": "CANCELLED",
    "expiresAt": "2026-07-20T08:12:00.000Z"
  }
}
```

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Học phí không có số tiền dương, thiếu cấu hình thu học phí hoặc bank manual mặc định không sẵn sàng. |
| `401` / `403` | Chưa đăng nhập hoặc token không có ngữ cảnh học sinh. |
| `404` | Học phí/attempt không tồn tại hoặc không thuộc học sinh hiện tại. |
| `422` | Học phí hoặc payment intent không còn ở trạng thái có thể thanh toán; attempt hủy không còn `PENDING`. |
