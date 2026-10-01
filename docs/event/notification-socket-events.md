# Notification socket events

Socket.IO dùng namespace gốc. JWT được xác thực khi kết nối và socket tham gia room riêng `user:{userId}`.

## `notification:changed`

Đây là event invalidation cho client đồng bộ lại bằng REST; payload không chứa title, message hay metadata.

```json
{
  "version": 1,
  "reason": "CREATED",
  "notificationId": 42,
  "occurredAt": "2026-10-01T07:00:00.000Z"
}
```

- `reason`: `CREATED`, `READ`, `READ_ALL`, `DELETED`.
- `notificationId` chỉ có khi thay đổi áp dụng cho một notification.
- Event chỉ được phát sau khi thao tác DB/transaction đã hoàn tất. REST + DB vẫn là nguồn sự thật.

Các event cũ `notification:new`, `notification:read`, `notification:deleted`, `notification:stats-updated` được giữ nguyên
để không làm hỏng Admin/Student frontend hiện tại.
