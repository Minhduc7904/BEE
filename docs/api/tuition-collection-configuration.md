# Tuition Collection Configuration API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Permission cho cả hai endpoint: `tuition-collection-configuration:manage`.
- Đây là cấu hình singleton. API không tự tạo bản ghi cấu hình; khi chưa khởi tạo, `GET` và `PUT` trả `404`.
- Thay đổi cấu hình chỉ áp dụng cho các payment attempt/QR được tạo sau đó; attempt cũ tiếp tục dùng snapshot hiện có.

## Kiểu dữ liệu response

```json
{
  "tuitionCollectionConfigurationId": 1,
  "collectionMode": "AUTOMATIC",
  "defaultManualReceivingBankAccountId": 12,
  "createdAt": "2026-07-20T08:00:00.000Z",
  "updatedAt": "2026-07-20T10:00:00.000Z"
}
```

`collectionMode` nhận một trong hai giá trị:

- `AUTOMATIC`: ưu tiên luồng thu tự động.
- `MANUAL_FALLBACK`: dùng luồng chờ đối soát thủ công khi phát hành QR mới.

## `GET /api/admin/tuition-collection-configuration`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `tuition-collection-configuration:manage` |
| Status thành công | `200 OK` |
| Side effect | Không có audit log |

Response:

```json
{
  "success": true,
  "message": "Lấy cấu hình thu học phí thành công",
  "data": {
    "tuitionCollectionConfigurationId": 1,
    "collectionMode": "AUTOMATIC",
    "defaultManualReceivingBankAccountId": 12,
    "createdAt": "2026-07-20T08:00:00.000Z",
    "updatedAt": "2026-07-20T10:00:00.000Z"
  }
}
```

## `PUT /api/admin/tuition-collection-configuration`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `tuition-collection-configuration:manage` |
| Status thành công | `200 OK` |
| Side effect | Cập nhật cấu hình và tạo audit `UPDATE_TUITION_COLLECTION_CONFIGURATION` khi có thay đổi thực sự |

Body nhận một hoặc cả hai trường cấu hình, đồng thời luôn yêu cầu `reason` để truy vết audit:

```json
{
  "collectionMode": "MANUAL_FALLBACK",
  "defaultManualReceivingBankAccountId": 12,
  "reason": "Chuyển tạm sang đối soát thủ công trong thời gian bảo trì SePay"
}
```

| Trường | Bắt buộc | Quy tắc |
| --- | --- | --- |
| `collectionMode` | Không | `AUTOMATIC` hoặc `MANUAL_FALLBACK`. |
| `defaultManualReceivingBankAccountId` | Không | Số nguyên dương. Tài khoản phải tồn tại và ở trạng thái `ACTIVE`. |
| `reason` | Có | Chuỗi 3-500 ký tự; chỉ dùng để ghi audit, không lưu vào bản ghi cấu hình. |

Response:

```json
{
  "success": true,
  "message": "Cập nhật cấu hình thu học phí thành công",
  "data": {
    "tuitionCollectionConfigurationId": 1,
    "collectionMode": "MANUAL_FALLBACK",
    "defaultManualReceivingBankAccountId": 12,
    "createdAt": "2026-07-20T08:00:00.000Z",
    "updatedAt": "2026-07-20T10:05:00.000Z"
  }
}
```

Audit ghi nhận `adminId` từ JWT, snapshot trước/sau của mode và default bank, cùng `reason`. Nếu body không làm thay đổi mode/default bank, API vẫn trả cấu hình hiện tại nhưng không tạo audit giả.

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | `reason` thiếu/không hợp lệ; mode không hợp lệ; ID tài khoản mặc định không phải số nguyên dương. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission cấu hình thu học phí. |
| `404` | Chưa có cấu hình singleton; hoặc tài khoản mặc định được chỉ định không tồn tại. |
| `409` | Tài khoản mặc định không ở trạng thái `ACTIVE`. |
