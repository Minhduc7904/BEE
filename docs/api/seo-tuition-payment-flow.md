# Luồng thanh toán học phí SEO cho phụ huynh

Đây là luồng công khai cho trang SEO, **không dùng JWT**. Quyền truy cập một học sinh được xác thực bằng cặp `studentId` và `parentPhone`.

- REST base URL: `/api/seo/tuition-payments`.
- Socket.IO namespace: `/seo`.
- `parentPhone` là query parameter bắt buộc của mọi API payment, và nằm trong payload của mọi event Socket client → server.
- Backend luôn kiểm tra số này có đúng là số phụ huynh đã khai báo cho `studentId` hay không. Học sinh không có `parentPhone` không dùng được luồng này.
- Nếu kiểm tra không qua, backend trả `404`; FE dừng luồng và không retry bằng `studentId` đó.

## 1. Tìm và chọn học sinh

Người dùng nhập số điện thoại phụ huynh **hoặc** số điện thoại học sinh.

```http
GET /api/seo/tuition-payments/students?phone=0901234567
```

Không có body, không có `Authorization` header.

Response thành công:

```json
{
  "success": true,
  "message": "Tìm thấy học sinh theo số điện thoại",
  "data": [
    { "studentId": 12, "fullName": "Nguyễn Văn A", "grade": 7 },
    { "studentId": 18, "fullName": "Nguyễn Văn B", "grade": 9 }
  ]
}
```

Quy tắc điều hướng FE:

1. `data.length === 0`: hiển thị không tìm thấy học sinh có thể thanh toán.
2. `data.length === 1`: điều hướng ngay đến trang payment của `data[0].studentId`.
3. `data.length > 1`: hiển thị danh sách chọn học sinh; chỉ điều hướng sau khi phụ huynh chọn một em.

FE giữ `studentId` đã chọn và chính số điện thoại vừa nhập làm `parentPhone` cho toàn bộ bước tiếp theo. API tìm kiếm không trả về `parentPhone`.

Ví dụ điều hướng:

```text
/seo/payment?studentId=12&parentPhone=0901234567
```

> Đây chỉ là quy ước FE. Backend chỉ yêu cầu `studentId` trong path và `parentPhone` trong query string của REST API.

## 2. Luồng màn danh sách học phí

Sau khi đã chọn học sinh, gọi danh sách và hai endpoint thống kê. Ba endpoint đều không có body.

```http
GET /api/seo/tuition-payments/students/12?parentPhone=0901234567&page=1&limit=20&sortBy=createdAt&sortOrder=desc
GET /api/seo/tuition-payments/students/12/stats/status?parentPhone=0901234567
GET /api/seo/tuition-payments/students/12/stats/money?parentPhone=0901234567
```

- Khi mở trang: gọi danh sách, đồng thời gọi hai API stats.
- Khi đổi trang hoặc bấm làm mới: gọi lại API danh sách với `page` hiện tại; có thể gọi lại stats nếu UI cần đồng bộ tổng quan.
- Filter danh sách tùy chọn: `month`, `year`, `status`, `minAmount`, `maxAmount`, `page`, `limit`, `sortBy`, `sortOrder`.
- Stats nhận filter tùy chọn `month`, `year`.

Response danh sách:

```json
{
  "success": true,
  "message": "Lấy danh sách học phí thành công",
  "data": [
    {
      "paymentId": 201,
      "studentId": 12,
      "courseId": 5,
      "month": 7,
      "year": 2026,
      "amount": 1200000,
      "status": "UNPAID",
      "statusLabel": "Chưa thanh toán",
      "paidAt": null,
      "notes": null,
      "createdAt": "2026-07-20T00:00:00.000Z",
      "updatedAt": "2026-07-20T00:00:00.000Z",
      "paymentIntent": {
        "paymentIntentId": 15,
        "tuitionPaymentId": 201,
        "amount": 1200000,
        "currency": "VND",
        "status": "PENDING",
        "expiresAt": null,
        "createdAt": "2026-07-20T00:00:00.000Z",
        "updatedAt": "2026-07-20T00:00:00.000Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

Response stats trạng thái:

```json
{
  "success": true,
  "data": { "paid": 2, "unpaid": 1, "total": 3 }
}
```

Response stats tiền:

```json
{
  "success": true,
  "data": { "collected": 2400000, "uncollected": 1200000, "expected": 3600000 }
}
```

## 3. Luồng mở và thanh toán một học phí

`paymentId` dưới đây là `tuitionPaymentId`; không phải `paymentIntentId`.

| Điều kiện          | Request                        | Cách dùng response                                                |
| ------------------ | ------------------------------ | ----------------------------------------------------------------- |
| Mở màn payment     | Gọi song song detail và status | Dùng status làm nguồn quyết định có lấy QR/subscribe hay không.   |
| Intent là `PAID`   | Không gọi thêm API             | Hiển thị thành công; không lấy QR, không Socket.                  |
| Intent chưa `PAID` | Lấy payment instructions       | Hiển thị QR/hướng dẫn; dùng `paymentIntentId` để theo dõi Socket. |
| QR hết hạn         | Lấy lại payment instructions   | Backend trả QR/attempt dùng được hoặc tạo QR mới khi cần.         |
| Bấm tạo QR mới     | Refresh payment instructions   | Luôn thay QR hiện tại bằng attempt mới trả về.                    |
| Bấm hủy            | Cancel đúng `paymentAttemptId` | Xóa QR/đếm ngược của attempt đã hủy.                              |

### 3.1 Lấy detail và payment intent status

```http
GET /api/seo/tuition-payments/students/12/payments/201?parentPhone=0901234567
GET /api/seo/tuition-payments/students/12/payments/201/payment-intent-status?parentPhone=0901234567
```

Response detail có cùng shape của một phần tử `data` trong API danh sách. Response status:

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

Chỉ khi `tuitionPaymentStatus !== "PAID"` và `intentStatus !== "PAID"` mới tiếp tục lấy QR và subscribe Socket.

### 3.2 Lấy QR/hướng dẫn thanh toán

```http
GET /api/seo/tuition-payments/students/12/payments/201/payment-instructions?parentPhone=0901234567
```

Response:

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

FE hiển thị `qrCodeUrl`, số tiền, `transferContent`, tài khoản nhận và đếm ngược đến `expiresAt`. `paymentIntentId` là ID dùng cho Socket; `paymentAttemptId` là ID dùng khi hủy.

### 3.3 Tạo QR mới

```http
POST /api/seo/tuition-payments/students/12/payments/201/payment-instructions/refresh?parentPhone=0901234567
```

Không có request body. Response có **đúng shape** `PaymentInstructionResponseDto` ở trên nhưng là QR/attempt mới. FE thay toàn bộ QR, `paymentAttemptId`, `attemptCode` và `expiresAt` bằng response mới.

### 3.4 Hủy attempt đang chờ

```http
POST /api/seo/tuition-payments/students/12/payments/201/payment-attempts/42/cancel?parentPhone=0901234567
```

Không có request body. Response:

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

## 4. Socket payment intent

Kết nối Socket.IO đến namespace `/seo` và không gửi JWT.

```ts
const socket = io(`${API_SOCKET_URL}/seo`)
```

Trước subscribe, FE phải gọi REST `payment-intent-status`. Khi Socket `connect` hoặc `reconnect`, lặp lại bước REST status; chỉ subscribe nếu intent vẫn chưa `PAID`.

Payload chung cho `subscribe` và `unsubscribe`:

```json
{
  "studentId": 12,
  "parentPhone": "0901234567",
  "paymentIntentId": 15
}
```

### Event client → server

```ts
socket.emit('tuition-payment:intent:subscribe', {
  studentId: 12,
  parentPhone: '0901234567',
  paymentIntentId: 15,
})
```

Server kiểm tra `parentPhone` thuộc `studentId`, rồi kiểm tra intent thuộc học sinh này trước khi cho vào room. FE emit `tuition-payment:intent:unsubscribe` với đúng payload khi nhận PAID, rời trang, đổi payment hoặc cleanup component.

### Event server → client

| Event                                 | Payload                                                     | Cách xử lý FE                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `tuition-payment:intent:subscribed`   | `{ success: true, paymentIntentId: 15, timestamp }`         | Xác nhận đã vào room; không cần thao tác riêng.                                                                                   |
| `tuition-payment:intent:status`       | `{ success: true, intent: PaymentIntentStatus, timestamp }` | Cập nhật trạng thái snapshot. Nếu `intent.tuitionPaymentStatus` hoặc `intent.intentStatus` là `PAID`, xóa QR và unsubscribe ngay. |
| `tuition-payment:intent:paid`         | `{ success: true, intent: PaymentIntentStatus, timestamp }` | Hiển thị thanh toán thành công, xóa QR/dừng countdown và unsubscribe ngay.                                                        |
| `tuition-payment:intent:unsubscribed` | `{ success: true, paymentIntentId: 15, timestamp }`         | Xác nhận đã rời room.                                                                                                             |
| `error`                               | `{ message: string, code: string, timestamp }`              | Hiển thị lỗi; không retry subscribe mù quáng.                                                                                     |

`PaymentIntentStatus` trong event có shape:

```json
{
  "paymentIntentId": 15,
  "tuitionPaymentId": 201,
  "tuitionPaymentStatus": "PAID",
  "intentStatus": "PAID",
  "paidAt": "2026-07-21T02:15:00.000Z",
  "intentUpdatedAt": "2026-07-21T02:15:00.000Z"
}
```

Các error code Socket hiện có: `INVALID_PAYMENT_INTENT_ID`, `TUITION_PAYMENT_INTENT_SUBSCRIBE_FAILED`, `TUITION_PAYMENT_INTENT_UNSUBSCRIBE_FAILED`. Khi gặp lỗi hoặc mất kết nối, FE gọi lại REST status trước khi quyết định subscribe lại.

## 5. Lỗi REST cần xử lý

| HTTP status | Ý nghĩa và hành vi FE                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`       | Thiếu/sai format `phone`, `parentPhone`, ID hoặc filter. Hiển thị lỗi nhập liệu.                                                                                    |
| `404`       | Không khớp `studentId` + `parentPhone`, học sinh chưa có SĐT phụ huynh, hoặc payment/intent/attempt không thuộc học sinh. Dừng luồng và quay lại bước tìm học sinh. |
| `422`       | Payment/intent/attempt không còn ở trạng thái có thể thao tác, ví dụ attempt không còn `PENDING`. Gọi lại REST status; nếu đã `PAID` thì kết thúc luồng.            |

Đây là luồng độc lập với trang student đã đăng nhập. Chi tiết danh mục endpoint tóm tắt tại [SEO Tuition Payments API](seo-tuition-payments.md), và contract Socket riêng tại [SEO tuition payment intent Socket events](../event/seo-tuition-payment-intent-socket-events.md).
