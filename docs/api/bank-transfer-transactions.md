# Bank Transfer Transactions API

Base URL: `/api`.

Các API bên dưới dành cho quản trị viên đã đăng nhập Bearer JWT. Chúng chỉ đọc dữ liệu giao dịch, không tạo audit log.

## Permissions

| API | Permission |
| --- | --- |
| Danh sách | `bank-transfer-transaction:get-all` |
| Chi tiết | `bank-transfer-transaction:get-by-id` |
| Thống kê | `bank-transfer-transaction:stats` |

| Đồng bộ SePay | `bank-transfer-transaction:sync-sepay` |

## Statuses

- `processingStatus`: `RECEIVED`, `MATCHED`, `UNMATCHED`, `AMOUNT_MISMATCH`, `IGNORED`, `ERROR`.
- `reconciliationStatus`:
  - `UNRECONCILED`: chưa đối soát.
  - `AUTOMATIC`: BE đã tự động đối soát từ webhook SePay.
  - `ADMIN`: quản trị viên đã đối soát thủ công.

## `GET /api/admin/bank-transfer-transactions`

Lấy danh sách giao dịch chuyển khoản, có phân trang.

| Query | Kiểu | Mô tả |
| --- | --- | --- |
| `page`, `limit` | số | Phân trang, `page >= 1`, `limit` từ 1 đến 1000. |
| `search` | chuỗi | Tìm trong mã giao dịch provider, số tài khoản nhận, nội dung chuyển khoản hoặc reference; tối đa 255 ký tự. |
| `provider` | enum | Hiện hỗ trợ `SEPAY`. |
| `paymentAttemptId` | số | ID `PaymentAttempt` đã gắn với giao dịch. |
| `receivingBankAccountId` | số hoặc `null` | Tài khoản nhận nội bộ được nhận diện duy nhất từ `receivingAccountNumber`; `null` khi không có hoặc dữ liệu mơ hồ. |
| `processingStatus` | enum | Lọc trạng thái xử lý. |
| `reconciliationStatus` | enum | Lọc trạng thái đối soát. |
| `providerTransactionId` | chuỗi | Lọc một phần mã giao dịch từ provider. |
| `receivingAccountNumber` | chuỗi | Lọc một phần số tài khoản nhận. |
| `minAmount`, `maxAmount` | số | Khoảng số tiền, lớn hơn hoặc bằng 0. |
| `fromTransactionAt`, `toTransactionAt` | ISO datetime | Khoảng thời điểm phát sinh giao dịch. |
| `sortBy` | chuỗi | Một trong `bankTransferTransactionId`, `providerTransactionId`, `amount`, `transactionAt`, `processingStatus`, `reconciliationStatus`, `createdAt`, `updatedAt`. Mặc định `transactionAt`. |
| `sortOrder` | `asc` / `desc` | Mặc định `desc`. |

Response `200 OK`:

```json
{
  "success": true,
  "message": "Lấy danh sách giao dịch chuyển khoản thành công",
  "data": [
    {
      "bankTransferTransactionId": 91,
      "provider": "SEPAY",
      "providerTransactionId": "SEPAY-20260720-001",
      "sepayV2TransactionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "paymentAttemptId": 31,
      "receivingBankAccountId": 4,
      "amount": 1500000,
      "transactionAt": "2026-07-20T08:00:00.000Z",
      "receivingAccountNumber": "0123456789",
      "content": "HP7A82F TP201 HSNGUYEN VAN A 0901234567",
      "reference": null,
      "processingStatus": "MATCHED",
      "reconciliationStatus": "AUTOMATIC",
      "createdAt": "2026-07-20T08:00:02.000Z",
      "updatedAt": "2026-07-20T08:00:03.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## `GET /api/admin/bank-transfer-transactions/tuition-payment/:tuitionPaymentId`

Returns the same paginated response and supports the same filters/sort as the main list, except `paymentAttemptId` is controlled by the server.

| Property | Value |
| --- | --- |
| Permission | `bank-transfer-transaction:get-all` |
| Path | `tuitionPaymentId` is a positive tuition payment ID. |
| Success | `200 OK` |

The backend finds the tuition payment, its payment intent, and all attempts belonging to that intent. Results contain bank transactions whose `paymentAttemptId` is in those attempt IDs, **or** whose `paymentAttemptId` is `null`. This gives the admin both transactions already associated with the tuition payment and unassigned transactions available for manual reconciliation. If a legacy tuition payment has no intent yet, the list contains only unassigned transactions. A missing tuition payment returns `404`.

Example:

```http
GET /api/admin/bank-transfer-transactions/tuition-payment/201?reconciliationStatus=UNRECONCILED&page=1&limit=20
```

## `GET /api/admin/bank-transfer-transactions/:id`

Lấy chi tiết một giao dịch. Ngoài các trường của danh sách, response có `rawPayload`: payload gốc SePay mà backend đã lưu để phục vụ tra soát.

Response `200 OK`:

```json
{
  "success": true,
  "message": "Lấy chi tiết giao dịch chuyển khoản thành công",
  "data": {
    "bankTransferTransactionId": 91,
    "provider": "SEPAY",
    "providerTransactionId": "SEPAY-20260720-001",
    "sepayV2TransactionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "receivingBankAccountId": 4,
    "amount": 1500000,
    "transactionAt": "2026-07-20T08:00:00.000Z",
    "processingStatus": "MATCHED",
    "reconciliationStatus": "AUTOMATIC",
    "rawPayload": { "id": 123456 }
  }
}
```

Trả `404 Not Found` nếu không tồn tại giao dịch.

## `GET /api/admin/bank-transfer-transactions/statistics`

Trả số lượng giao dịch theo trạng thái đối soát và tổng số tiền VND. Hỗ trợ cùng các filter nghiệp vụ của API danh sách: `search`, `provider`, `paymentAttemptId`, `processingStatus`, `providerTransactionId`, `receivingAccountNumber`, `minAmount`, `maxAmount`, `fromTransactionAt`, `toTransactionAt`.

`reconciliationStatus` cũng được nhận để giữ tương thích query, nhưng không giới hạn các nhóm thống kê: response luôn phân rã đủ chưa đối soát, admin đối soát và tự động đối soát trong phạm vi các filter còn lại.

Response `200 OK`:

```json
{
  "success": true,
  "message": "Lấy thống kê giao dịch chuyển khoản thành công",
  "data": {
    "totalTransactions": 120,
    "unreconciledTransactions": 7,
    "automaticReconciledTransactions": 98,
    "adminReconciledTransactions": 15,
    "totalAmount": 185000000,
    "currency": "VND"
  }
}
```

## `POST /api/admin/bank-transfer-transactions/sync-sepay`

Yêu cầu SePay API v2 đồng bộ các giao dịch tiền vào kể từ `SepayTransactionSyncCursor.scope = IN_ALL`. Mỗi giao dịch mới đi qua cùng processor với webhook SePay: lưu idempotent, nhận diện tài khoản nhận tiền và tự động đối soát học phí nếu đủ điều kiện. Endpoint không nhận body.

- Permission: `bank-transfer-transaction:sync-sepay`.
- Actor: admin đang đăng nhập; lần chạy thành công/thất bại được audit.
- Khóa job `SEPAY_TRANSACTION_SYNC` được dùng chung cho API này và scheduler chạy tại giây 0 của mỗi 5 phút (`0 */5 * * * *`, múi giờ `Asia/Ho_Chi_Minh`). API thủ công vẫn chạy khi cấu hình scheduler đang tắt.
- Cursor chỉ tiến sau khi toàn bộ một trang giao dịch đã commit. Nếu SePay, database hoặc processor lỗi, cursor không tiến qua trang lỗi.

Response `200 OK`:

```json
{
  "success": true,
  "message": "Đồng bộ giao dịch SePay thành công",
  "data": {
    "backgroundJobRunId": 14,
    "fetchedTransactions": 25,
    "newTransactions": 3,
    "duplicateTransactions": 22,
    "automaticallyMatchedTransactions": 1,
    "lastSinceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

Khi một lần đồng bộ khác còn giữ lease, trả `409 Conflict`. Frontend phải kiểm tra `code` để hiển thị trạng thái đang đồng bộ và có thể thử lại sau `retryAt`; không tự gọi song song.

```json
{
  "statusCode": 409,
  "code": "SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING",
  "message": "Đồng bộ giao dịch SePay đang chạy",
  "retryAt": "2026-07-21T03:10:00.000Z"
}
```

## Errors

- `409`: `SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING` khi job đồng bộ SePay đang chạy ở API khác hoặc scheduler.
- `502` / `500`: SePay hoặc hạ tầng không thể hoàn tất đồng bộ; cursor giữ nguyên checkpoint của trang thành công gần nhất.

- `400`: query không hợp lệ.
- `401` / `403`: chưa đăng nhập hoặc thiếu permission tương ứng.
- `404`: `:id` không tồn tại ở API chi tiết.
