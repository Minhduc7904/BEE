# Thanh toán khóa học qua SePay

Mỗi lần thanh toán chỉ áp dụng cho một `CourseEnrollment`. Course có phí trả về QR SePay, tài khoản nhận, số tiền và nội dung bắt buộc có dạng `KH<5-ký-tự> CE<courseEnrollmentId> HS<TEN> <SĐT>`. Không còn contract invoice cũ.

## API public SEO

Tất cả endpoint public nằm dưới `/api/courses/public/seo/:courseIdOrCode`. Credential phải có đúng một trong `email` hoặc `username`, cùng `password`.

| Method | Path cuối | Body | Kết quả |
| --- | --- | --- | --- |
| `POST` | `/payment-instructions` | `{ email|username, password }` | Tạo hoặc tái dùng hướng dẫn thanh toán |
| `POST` | `/payment-instructions/refresh` | `{ email|username, password }` | Hết hạn attempt cũ và tạo QR/nội dung mới |
| `POST` | `/payment-instructions/status` | `{ paymentIntentId, email|username, password }` | Snapshot trạng thái thuộc đúng học sinh |

`payment-instructions` trả `courseEnrollmentId`, `paymentIntentId`, `paymentAttemptId`, `attemptCode`, `amount`, `currency`, `transferContent`, `qrCodeUrl`, `expiresAt`, `status`, `confirmationMode` và `receivingBankAccount`. Course miễn phí trả `status: "FREE"` và enrollment đã `ACTIVE`, không có intent/attempt.

## API StudentFrontend

JWT học sinh dùng các biến thể sau:

| Method | Path cuối | Mục đích |
| --- | --- | --- |
| `POST` | `/payment-instructions/me` | Lấy hoặc tạo hướng dẫn thanh toán |
| `GET` | `/payment-instructions/me/:paymentIntentId` | Snapshot REST khi mở lại trang hoặc socket reconnect |

Backend xác thực ownership của enrollment ở cả snapshot lẫn Socket.IO. Frontend hiển thị nguyên văn `transferContent`, không tự tạo mã `KH`.

## Quy tắc trạng thái và lỗi

- `PENDING` chỉ được xác nhận khi SePay báo giao dịch incoming, đúng account, đúng amount, attempt chưa hết hạn và reference khớp.
- Khi thành công, attempt/intent/enrollment/transaction được cập nhật trong một transaction; enrollment thành `ACTIVE`, `isPaidFull = true`.
- `404` khi course không public, payment intent không phải của học sinh, hoặc intent không thuộc loại `COURSE_PURCHASE`.
- `400` khi credential có cả email và username (hoặc không có trường nào), QR hết hạn/sai trạng thái, hoặc input không hợp lệ.
- `401` khi credential không đúng/không phải học sinh hoạt động.
- `404`/business error khi Admin chưa cấu hình bank course hoặc bank đã không còn active/khả dụng.

## API dùng chung

`POST /api/webhooks/sepay/transactions` và `POST /api/admin/bank-transfer-transactions/sync-sepay` là hạ tầng chung; frontend không gọi webhook. Webhook giữ xác thực HMAC và idempotency theo provider transaction ID. Danh sách admin dùng `GET /api/admin/bank-transfer-transactions?type=COURSE_PURCHASE`.

## Phân loại enrollment cho AdminFrontend

`GET /api/course-enrollments` hỗ trợ query `type`:

- `MANUAL`: enrollment do các luồng admin hiện hữu tạo cho học sinh.
- `ONLINE_PURCHASE`: enrollment do học sinh bắt đầu luồng thanh toán mua course qua SePay tạo ra.

Danh sách dùng cho đối soát thủ công phải gọi `GET /api/course-enrollments?type=ONLINE_PURCHASE`. API xác nhận cũng từ chối enrollment `MANUAL`, kể cả khi có một giao dịch SePay phù hợp.

Xem thêm: [luồng Admin](admin-course-payment-flow.md), [luồng Student](student-course-payment-flow.md), [Socket events](../event/course-payment-intent-socket-events.md).
