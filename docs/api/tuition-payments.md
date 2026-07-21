# Tuition Payments API

## `GET /api/tuition-payments` (admin list)

`GET /api/tuition-payments`, `GET /api/tuition-payments/course/:courseId` và `GET /api/tuition-payments/student/:studentId` đều trả mỗi học phí kèm `paymentIntent` snapshot hoặc `null` với dữ liệu cũ chưa có intent. Snapshot này không chứa attempt hoặc giao dịch ngân hàng; admin dùng `GET /api/tuition-payments/:id` khi cần chi tiết đối soát.

```json
{
  "paymentId": 201,
  "amount": 1200000,
  "status": "UNPAID",
  "paymentIntent": {
    "paymentIntentId": 15,
    "tuitionPaymentId": 201,
    "amount": 1200000,
    "currency": "VND",
    "status": "PENDING",
    "expiresAt": null
  }
}
```

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Mọi thao tác ghi đều tạo audit log.
- Mọi API tạo học phí (`POST /api/tuition-payments`, `POST /api/tuition-payments/bulk`, `POST /api/tuition-payments/bulk-array`) tạo `PaymentIntent` trong cùng transaction. Học phí `UNPAID` tạo intent `PENDING`; học phí được tạo trực tiếp ở trạng thái `PAID` tạo intent `PAID`.
- Số tiền học phí phải được xác định (có thể là `0`); không chấp nhận `amount: null` vì `PaymentIntent` luôn cần snapshot số tiền.

## `GET /api/tuition-payments/my`

| Thuộc tính | Giá trị |
| --- | --- |
| Actor | Học sinh đã đăng nhập bằng Bearer JWT. |
| Ownership | Backend luôn lấy `studentId` từ JWT; query client không thể đổi chủ sở hữu dữ liệu. |
| Status thành công | `200 OK` |
| Response | Danh sách học phí phân trang của học sinh, mỗi phần tử luôn có `paymentIntent` tương ứng hoặc `null` cho dữ liệu cũ chưa có intent. |

Query filter và phân trang dùng `TuitionPaymentListQueryDto` hiện có, ví dụ:

```http
GET /api/tuition-payments/my?page=1&limit=10&year=2026
Authorization: Bearer <student-jwt>
```

```json
{
  "success": true,
  "message": "Lấy danh sách học phí thành công",
  "data": [
    {
      "paymentId": 201,
      "amount": 500000,
      "status": "UNPAID",
      "paymentIntent": {
        "paymentIntentId": 15,
        "tuitionPaymentId": 201,
        "amount": 500000,
        "currency": "VND",
        "status": "PENDING",
        "expiresAt": null,
        "createdAt": "2026-07-20T00:00:00.000Z",
        "updatedAt": "2026-07-20T00:00:00.000Z"
      }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

`paymentIntent` là snapshot thông tin intent, không chứa `PaymentAttempt`, QR hoặc giao dịch ngân hàng. Client dùng `paymentIntentId` để subscribe room realtime sau khi cần thanh toán.

## `GET /api/tuition-payments/my/:id`

| Thuộc tính | Giá trị |
| --- | --- |
| Actor | Học sinh đã đăng nhập bằng Bearer JWT. |
| Ownership | `studentId` lấy từ JWT và phải trùng tuition payment. |
| Status thành công | `200 OK` |
| Response | Chi tiết học phí và snapshot `paymentIntent`; không trả payment attempt hay giao dịch ngân hàng. |

```http
GET /api/tuition-payments/my/201
Authorization: Bearer <student-jwt>
```

```json
{
  "success": true,
  "message": "Lấy chi tiết học phí thành công",
  "data": {
    "paymentId": 201,
    "studentId": 12,
    "amount": 500000,
    "status": "UNPAID",
    "paidAt": null,
    "paymentIntent": {
      "paymentIntentId": 15,
      "tuitionPaymentId": 201,
      "amount": 500000,
      "currency": "VND",
      "status": "PENDING",
      "expiresAt": null,
      "createdAt": "2026-07-20T00:00:00.000Z",
      "updatedAt": "2026-07-20T00:00:00.000Z"
    }
  }
}
```

`paymentIntent` có thể là `null` với dữ liệu học phí cũ chưa được backfill. FE dùng `paymentIntentId` để lấy snapshot status hoặc subscribe realtime intent room.

| HTTP status | Khi nào |
| --- | --- |
| `401` | JWT không đại diện cho học sinh. |
| `403` | Học phí không thuộc học sinh hiện tại. |
| `404` | Tuition payment không tồn tại. |

## `GET /api/tuition-payments/my/:id/payment-intent-status`

| Thuộc tính | Giá trị |
| --- | --- |
| Actor | Học sinh đã đăng nhập |
| Permission | Không cần permission riêng; vẫn yêu cầu Bearer JWT (`RequirePermission()`). |
| Ownership | `studentId` lấy từ JWT và phải trùng chủ sở hữu tuition payment. |
| Status thành công | `200 OK` |
| Mục đích | Snapshot một lần trước khi client subscribe Socket.IO intent room. |

`id` là `tuitionPaymentId` nguyên dương, không phải `paymentIntentId`.

```http
GET /api/tuition-payments/my/201/payment-intent-status
Authorization: Bearer <student-jwt>
```

```json
{
  "success": true,
  "message": "Lấy trạng thái payment intent thành công",
  "data": {
    "paymentIntentId": 15,
    "tuitionPaymentId": 201,
    "tuitionPaymentStatus": "UNPAID",
    "intentStatus": "PENDING",
    "paidAt": null,
    "intentUpdatedAt": "2026-07-21T02:10:00.000Z"
  }
}
```

Sau response này, client dùng `paymentIntentId` để subscribe `tuition-payment:intent:subscribe`. Event Socket chi tiết nằm trong `docs/event/tuition-payment-intent-socket-events.md`. Không polling endpoint này định kỳ; chỉ gọi lại khi reconnect hoặc cần phục hồi sau khi mất event.

| HTTP status | Khi nào |
| --- | --- |
| `401` | Chưa đăng nhập hoặc JWT không có học sinh. |
| `403` | Tuition payment không thuộc học sinh hiện tại. |
| `404` | Tuition payment hoặc payment intent không tồn tại. |

## `GET /api/tuition-payments/:id`

| Thuộc tính | Giá trị |
| --- | --- |
| Actor | Quản trị viên đã đăng nhập |
| Permission | `tuition-payment:get-by-id` |
| Status thành công | `200 OK` |
| Response | Chi tiết học phí, `PaymentIntent`, các `PaymentAttempt` và giao dịch ngân hàng của từng attempt. |

`id` là `paymentId` nguyên dương. Response không trả `rawPayload` của webhook SePay. Nếu học phí cũ chưa có intent, `paymentIntent` là `null`.

```json
{
  "success": true,
  "message": "Lấy chi tiết học phí thành công",
  "data": {
    "paymentId": 201,
    "studentId": 12,
    "amount": 500000,
    "month": 7,
    "year": 2026,
    "status": "UNPAID",
    "paymentIntent": {
      "paymentIntentId": 15,
      "tuitionPaymentId": 201,
      "amount": 500000,
      "currency": "VND",
      "status": "PENDING",
      "expiresAt": null,
      "paymentAttempts": [
        {
          "paymentAttemptId": 42,
          "attemptCode": "HP7A82F",
          "amount": 500000,
          "status": "PENDING",
          "confirmationMode": "AUTOMATIC",
          "expiresAt": "2026-07-20T08:30:00.000Z",
          "bankTransferTransactions": [
            {
              "bankTransferTransactionId": 91,
              "provider": "SEPAY",
              "providerTransactionId": "123456",
              "receivingBankAccountId": 4,
              "amount": 500000,
              "processingStatus": "RECEIVED",
              "reconciliationStatus": "UNRECONCILED"
            }
          ]
        }
      ]
    }
  }
}
```

`PaymentIntent.expiresAt = null` nghĩa là vô hạn. Với giá trị thời gian cụ thể, intent hết hạn khi thời điểm hiện tại lớn hơn hoặc bằng giá trị đó; backend đổi intent `PENDING` thành `EXPIRED` khi học sinh lấy hướng dẫn thanh toán hoặc webhook SePay xử lý giao dịch.

## API tạo học phí

| Endpoint | Permission | Request | Response | Side effect |
| --- | --- | --- | --- | --- |
| `POST /api/tuition-payments` | `tuition-payment:create` | Một khoản học phí | Một `TuitionPayment` | Tạo `PaymentIntent` cùng transaction. |
| `POST /api/tuition-payments/bulk` | `tuition-payment:create-bulk` | Một mức thu cho course, grade hoặc danh sách học sinh | Danh sách học phí mới | Mỗi học phí mới có một intent; khoản đã tồn tại được bỏ qua. |
| `POST /api/tuition-payments/bulk-array` | `tuition-payment:create-bulk` | Mảng khoản thu riêng từng học sinh | Danh sách khoản được tạo | Mỗi học phí mới có một intent; phần tử trùng hoặc học sinh không hoạt động được bỏ qua theo luồng hiện có. |

### `POST /api/tuition-payments`

```json
{
  "studentId": 12,
  "courseId": 5,
  "amount": 500000,
  "month": 7,
  "year": 2026,
  "status": "UNPAID",
  "notes": "Học phí tháng 7"
}
```

```json
{
  "success": true,
  "message": "Tạo học phí thành công",
  "data": {
    "paymentId": 201,
    "studentId": 12,
    "courseId": 5,
    "amount": 500000,
    "month": 7,
    "year": 2026,
    "status": "UNPAID"
  }
}
```

`PaymentIntent` không được trả trực tiếp trong response để giữ tương thích API, nhưng đã tồn tại ngay khi response thành công. Nếu `amount` là `null`, toàn bộ transaction trả lỗi và không tạo học phí.

### `POST /api/tuition-payments/bulk`

```json
{
  "grade": 7,
  "amount": 500000,
  "month": 7,
  "year": 2026,
  "status": "UNPAID"
}
```

Response là `BaseResponseDto<TuitionPaymentResponseDto[]>`; mỗi phần tử trong `data` đã có intent tương ứng. Có thể dùng `courseId` hoặc `studentIds` thay `grade` theo DTO hiện có.

### `POST /api/tuition-payments/bulk-array`

```json
{
  "payments": [
    { "studentId": 12, "amount": 500000, "month": 7, "year": 2026, "status": "UNPAID" },
    { "studentId": 13, "amount": 600000, "month": 7, "year": 2026, "status": "UNPAID" }
  ]
}
```

Response là `BaseResponseDto<TuitionPaymentResponseDto[]>`; chỉ các phần tử tạo thành công xuất hiện trong `data` và mỗi phần tử đều có intent tương ứng. Bất kỳ phần tử nào có `amount: null` làm transaction rollback để không tạo học phí thiếu intent.

## `PUT /api/tuition-payments/:id`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `tuition-payment:update` |
| Status thành công | `200 OK` |
| Side effect | Cập nhật học phí, payment intent (nếu đổi số tiền) và audit `UPDATE_TUITION_PAYMENT`. |

`id` là số nguyên dương. API chỉ chấp nhận `amount`, `month`, `year` và chỉ dùng cho học phí `UNPAID`. **Không nhận** `notes`, `status` hoặc `paidAt`.

```json
{
  "amount": 1200000,
  "month": 8,
  "year": 2026
}
```

Khi có `amount`, backend cập nhật `PaymentIntent.amount` trong cùng transaction. Nếu số tiền thực sự thay đổi, toàn bộ `PaymentAttempt` `PENDING`/QR cũ của intent bị chuyển `EXPIRED`; học sinh cần lấy QR mới. Học phí dữ liệu cũ chưa có intent sẽ được tạo intent cùng transaction khi cập nhật số tiền.

## `POST /api/tuition-payments/:id/unreconcile-manual-payment`

| Property | Value |
| --- | --- |
| Permission | `tuition-payment:confirm-manual-payment` |
| Success | `200 OK` |
| Preconditions | Tuition payment must be `PAID` and have a payment intent. |

This endpoint reverses manual reconciliation in one transaction. It changes the tuition payment to `UNPAID` and clears `paidAt`, changes its payment intent to `PENDING`, and keeps all bank transactions as history while setting their `paymentAttemptId` to `null`, `processingStatus` to `RECEIVED`, and `reconciliationStatus` to `UNRECONCILED`.

## `PUT /api/tuition-payments/:id/manual-reconciliation`

| Property | Value |
| --- | --- |
| Permission | `tuition-payment:confirm-manual-payment` |
| Success | `200 OK` |
| Preconditions | Tuition payment must be `PAID`. |

```json
{
  "bankTransferTransactionIds": [91, 92]
}
```

The list is required and cannot contain duplicate IDs. Transactions currently attached to this tuition payment but omitted from the new list are released to `RECEIVED` and `UNRECONCILED` with no attempt link. Newly provided transactions must be unreconciled; the backend reuses a non-expired pending manual attempt when available, otherwise creates a new manual attempt, then marks the new transactions `MATCHED` and `ADMIN`. The entire change is audited and atomic.

## `POST /api/tuition-payments/:id/confirm-manual-payment`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `tuition-payment:confirm-manual-payment` |
| Status thành công | `200 OK` |
| Side effect | Chuyển tuition payment sang `PAID`, ghi audit `CONFIRM_MANUAL_TUITION_PAYMENT`, thông báo cho học sinh/phụ huynh. Nếu dữ liệu cũ chưa có `PaymentIntent`, backend tự tạo intent trong cùng transaction; sau đó intent luôn được chuyển sang `PAID`. |

API dùng khi admin đã đối soát chuyển khoản ngân hàng. Chỉ xác nhận được tuition payment đang `UNPAID`.

Body:

```json
{
  "paidAt": "2026-07-20T08:30:00.000Z",
  "bankTransferTransactionIds": [91, 92]
}
```

- `reference`: tùy chọn, mã tham chiếu giao dịch/sao kê, tối đa 100 ký tự.
- `reason`: tùy chọn, lý do đối soát, từ 3 đến 500 ký tự.
- `paidAt`: tùy chọn; nếu bỏ trống và có giao dịch ngân hàng, hệ thống dùng thời điểm phát sinh muộn nhất trong danh sách; nếu không có giao dịch, dùng thời điểm xác nhận.
- `bankTransferTransactionIds`: tùy chọn, là danh sách ID giao dịch ngân hàng chưa đối soát. Danh sách không được rỗng hoặc chứa ID trùng. Tất cả giao dịch phải thuộc đúng một tài khoản nhận đang hoạt động và không được gắn với attempt tự động hay attempt của học phí khác.
- Backend **không kiểm tra số tiền từng giao dịch hoặc tổng giao dịch có khớp học phí hay không** trong luồng đối soát thủ công. Đây là quyết định của admin sau khi kiểm tra sao kê; danh sách ID, reference và reason được ghi audit.
- Khi truyền danh sách, backend tạo/hoàn tất `PaymentAttempt` thủ công cho từng giao dịch và đánh dấu toàn bộ là admin đối soát trong cùng transaction. Một giao dịch không hợp lệ sẽ rollback toàn bộ thao tác.
- Hệ thống bổ sung ghi chú tiếng Việt vào `notes`, ví dụ: `Đã xác nhận chuyển khoản thủ công | Mã tham chiếu: MB-20260720-000123`.

Response:

```json
{
  "success": true,
  "message": "Xác nhận thanh toán học phí thủ công thành công",
  "data": {
    "paymentId": 201,
    "status": "PAID",
    "paidAt": "2026-07-20T08:30:00.000Z"
  }
}
```

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Body không hợp lệ hoặc có trường không được phép trong DTO cập nhật. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission tương ứng. |
| `404` | Không tồn tại tuition payment. |
| `422` | Cập nhật hoặc xác nhận thủ công cho tuition payment không còn `UNPAID`. |
