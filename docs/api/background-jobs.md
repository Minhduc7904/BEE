# Background Job API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: admin có permission tương ứng; tất cả endpoint dùng Bearer JWT.
- Đây là API vận hành, không phát QR, không gọi SePay trực tiếp và không thay đổi dữ liệu thanh toán.
- `lockToken` không bao giờ được trả về FE. `errorMessage` của run/cursor đã được Application lọc trước khi lưu.

## `GET /api/admin/background-jobs`

| Thuộc tính        | Giá trị                    |
| ----------------- | -------------------------- |
| Permission        | `background-job:get-all`   |
| Status thành công | `200 OK`                   |
| Use case          | `GetBackgroundJobsUseCase` |

Query: `page`, `limit`, `search` (tên job), `code=SEPAY_TRANSACTION_SYNC`, `isEnabled=true|false`, `sortBy=backgroundJobId|code|displayName|isEnabled|createdAt|updatedAt`, `sortOrder=asc|desc`.

## `GET /api/admin/background-jobs/:id`

| Thuộc tính        | Giá trị                    |
| ----------------- | -------------------------- |
| Permission        | `background-job:get-by-id` |
| Path              | `id` là số nguyên dương    |
| Status thành công | `200 OK`                   |

## `PUT /api/admin/background-jobs/:id`

| Thuộc tính        | Giá trị                                    |
| ----------------- | ------------------------------------------ |
| Permission        | `background-job:update`                    |
| Status thành công | `200 OK`                                   |
| Side effect       | Ghi admin audit khi trạng thái thực sự đổi |

```json
{
  "isEnabled": false
}
```

Chỉ `isEnabled` được phép cập nhật. `cronExpression`, `timezone` và `maxRuntimeSeconds` là cấu hình hệ thống để không tạo khác biệt với cron decorator đang chạy. Khi tắt, lượt scheduler tiếp theo bị bỏ qua; API sync thủ công vẫn được phép chạy.

## `GET /api/admin/background-job-locks`

| Thuộc tính        | Giá trị                    |
| ----------------- | -------------------------- |
| Permission        | `background-job:get-locks` |
| Status thành công | `200 OK`                   |

Query: `page`, `limit`, `search` (worker ID), `backgroundJobId`, `isActive=true|false`, `sortBy=backgroundJobId|workerId|lockedAt|leaseExpiresAt|updatedAt`, `sortOrder=asc|desc`.

## `GET /api/admin/background-job-runs`

| Thuộc tính        | Giá trị                   |
| ----------------- | ------------------------- |
| Permission        | `background-job:get-runs` |
| Status thành công | `200 OK`                  |

Query: `page`, `limit`, `backgroundJobId`, `status=RUNNING|SUCCEEDED|FAILED|SKIPPED`, `workerId`, `fromDate`, `toDate` (ISO 8601, lọc theo `scheduledAt`), `sortBy=backgroundJobRunId|backgroundJobId|scheduledAt|startedAt|finishedAt|status`, `sortOrder=asc|desc`.

## `GET /api/admin/background-job-runs/:id`

| Thuộc tính        | Giá trị                        |
| ----------------- | ------------------------------ |
| Permission        | `background-job:get-run-by-id` |
| Path              | `id` là số nguyên dương        |
| Status thành công | `200 OK`                       |

## `PUT /api/admin/sepay-transaction-sync-cursors/:scope`

| Property | Value |
| --- | --- |
| Permission | `background-job:update` |
| Path | `scope` is the immutable cursor scope |
| Success | `200 OK` |
| Side effect | Writes an admin audit record only when a checkpoint changes |

The request body must contain at least one field. Each field accepts `null` to clear the current value:

```json
{
  "lastSinceId": "6b7d6aa5-1ef0-4a2e-8753-4f7e5a292c88",
  "lastSyncedAt": "2026-07-21T09:30:00.000Z",
  "lastErrorAt": null,
  "lastErrorMessage": null
}
```

The API does not create cursors or change `scope`. It returns `409 Conflict` while the SePay sync job holds a lock, preventing an active worker from being overwritten. This only updates the sync cursor; it never changes bank transactions, reconciliation, or tuition payments.

## `GET /api/admin/sepay-transaction-sync-cursors`

| Thuộc tính        | Giá trị                                 |
| ----------------- | --------------------------------------- |
| Permission        | `background-job:get-sepay-sync-cursors` |
| Status thành công | `200 OK`                                |

Query: `page`, `limit`, `search` (scope), `sortBy=sepayTransactionSyncCursorId|scope|lastSyncedAt|lastErrorAt|createdAt|updatedAt`, `sortOrder=asc|desc`.

Cursor `IN_ALL` chỉ là checkpoint của SePay V2 cho `transfer_type=in`; không dùng cho giao dịch tiền ra.

## Response thành công

Endpoint danh sách trả `PaginationResponseDto`:

```json
{
  "success": true,
  "message": "Lấy danh sách job nền thành công",
  "data": [
    {
      "backgroundJobId": 1,
      "code": "SEPAY_TRANSACTION_SYNC",
      "displayName": "Đồng bộ giao dịch SePay",
      "cronExpression": "0 */5 * * * *",
      "timezone": "Asia/Ho_Chi_Minh",
      "isEnabled": true,
      "maxRuntimeSeconds": 300,
      "createdAt": "2026-07-21T07:00:00.000Z",
      "updatedAt": "2026-07-21T07:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1, "hasPrevious": false, "hasNext": false }
}
```

`BackgroundJobLock` trả `backgroundJobId`, `workerId`, `lockedAt`, `leaseExpiresAt`, `isActive`, timestamps. `BackgroundJobRun` trả ID job, mốc chạy, status, worker ID, retry count, error đã lọc và `resultSummary`; không trả lock token. Cursor trả scope, `lastSinceId`, thời điểm sync/lỗi gần nhất và lỗi đã lọc.

## Lỗi FE cần xử lý

| HTTP status   | Khi nào                                                   |
| ------------- | --------------------------------------------------------- |
| `400`         | ID, query hoặc body `isEnabled` không hợp lệ.             |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission.                     |
| `404`         | Không có `BackgroundJob` hoặc `BackgroundJobRun` theo ID. |
