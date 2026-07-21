# SePay Webhook API

## `POST /api/webhooks/sepay/transactions`

Đây là endpoint machine-to-machine, không dùng Bearer JWT và chỉ nhận cuộc gọi từ webhook SePay đã cấu hình **HMAC-SHA256**.

SePay ký đúng raw body theo chuỗi `{timestamp}.{raw_body}` và gửi:

```http
X-SePay-Signature: sha256=<hex-hmac>
X-SePay-Timestamp: <unix-seconds>
Content-Type: application/json
```

Backend kiểm tra chữ ký và timestamp (tối đa lệch 5 phút) bằng `SEPAY_WEBHOOK_SECRET`. Không dùng `SEPAY_API_KEY` cho xác thực webhook; biến đó chỉ dành cho các API chủ động gọi sang SePay.

Payload SePay:

```json
{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2026-07-20 08:30:00",
  "accountNumber": "1017588888",
  "code": "HP7A82F",
  "content": "HP7A82F chuyen tien",
  "transferType": "in",
  "transferAmount": 1200000,
  "referenceCode": "FT24012345678"
}
```

## Quy ước nội dung chuyển khoản

Khi API payment instruction phát hành `PaymentAttempt`/QR cho student, giá trị QR `des` phải theo format sau:

```text
{attemptCode} TP{tuitionPaymentId} HS{studentName} {parentPhone}
```

Ví dụ có số điện thoại phụ huynh:

```text
HP7A82F TP201 HSNGUYEN VAN A 0901234567
```

Nếu không có số điện thoại phụ huynh, bỏ phần số điện thoại cuối cùng:

```text
HP7A82F TP201 HSNGUYEN VAN A
```

- `attemptCode` là token duy nhất để auto-match, luôn đứng đầu, chỉ dùng ASCII chữ/số và không thay đổi sau khi tạo attempt.
- `tuitionPaymentId`, tên học sinh và số điện thoại phụ huynh chỉ nhằm hỗ trợ người chuyển tiền/admin đối soát; webhook **không** dùng các phần này để xác nhận thanh toán. Nội dung chỉ dùng chữ in hoa không dấu, chữ số và dấu cách; không dùng `|` hoặc `:`.
- Không đặt tiền tố của `attemptCode` vào các segment phụ (`TP`, `HS`) để SePay luôn bóc đúng mã đầu tiên.
- Cấu hình SePay Payment Code Structure phải nhận được `attemptCode`; ví dụ mã `HP7A82F` dùng prefix `HP`, suffix 5 ký tự, loại `alphanumeric`.

## Xử lý

- Dùng `id` của SePay làm `providerTransactionId` duy nhất để chống giao dịch trùng/retry.
- Với giao dịch tiền vào, backend lưu `receivingBankAccountId` khi `accountNumber` của SePay khớp đúng một `ReceivingBankAccount` nội bộ. Không có hoặc nhiều kết quả thì để `null`; không suy đoán theo nội dung chuyển khoản.
- Luôn lưu giao dịch nhận được. Giao dịch tiền ra, không tìm được attempt, sai account/code hoặc attempt manual được giữ để đối soát nhưng không tự xác nhận học phí.
- Chỉ auto-match khi attempt snapshot đang `PENDING`, thuộc `AUTOMATIC`, chưa hết hạn, đúng account nhận, đúng mã thanh toán và đúng số tiền.
- Khi match, trong một transaction: bank transfer là `MATCHED`, payment attempt là `SUCCEEDED`, payment intent là `PAID`, tuition payment là `PAID` với `paidAt` là thời gian giao dịch từ SePay.
- Sau commit, hệ thống gửi notification; lỗi notification không rollback thanh toán.

Response hợp lệ cho SePay:

```json
{ "success": true }
```

Trả `400` khi signature, timestamp hoặc payload không hợp lệ. SePay sẽ retry khi endpoint không trả `200/201` với body chứa `success: true`.

## Cấu hình

```dotenv
SEPAY_API_KEY=                   # Token gọi API SePay chủ động (nếu dùng)
SEPAY_V2_API_BASE_URL=https://userapi.sepay.vn/v2 # URL API v2 đồng bộ giao dịch
SEPAY_WEBHOOK_SECRET=            # Secret của HMAC-SHA256 webhook
```

Trong dashboard SePay, tạo webhook sự kiện **Có tiền vào**, URL `https://<host>/api/webhooks/sepay/transactions`, chọn bảo mật **HMAC-SHA256** và đặt secret trùng `SEPAY_WEBHOOK_SECRET`.
