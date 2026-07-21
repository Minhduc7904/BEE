# Tuition Grade Bank Accounts API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Permission cho cả hai API: `receiving-bank-account:configure-grade-mapping`.
- Hệ thống luôn có 12 bản ghi mapping cho khối `1` đến `12`.
- `receivingBankAccountId: null` không phải lỗi: khối đó dùng tài khoản fallback thủ công mặc định.

## `GET /api/admin/tuition-grade-bank-accounts`

| Thuộc tính | Giá trị |
| --- | --- |
| Status thành công | `200 OK` |
| Side effect | Không có audit log |

Trả về toàn bộ 12 khối. `confirmationMode = AUTOMATIC` chỉ khi tài khoản gán cho khối có `status = ACTIVE`, `sepayStatus = ACTIVE` và cấu hình thu học phí không ở chế độ thủ công. Những trường hợp khác trả `MANUAL_FALLBACK` cùng `fallbackReason`; FE hiển thị thông tin default manual bank và `isManualFallbackAvailable`.

```json
{
  "success": true,
  "message": "Lấy cấu hình tài khoản nhận tiền theo khối thành công",
  "data": [
    {
      "tuitionGradeReceivingBankAccountId": 1,
      "grade": 7,
      "receivingBankAccountId": null,
      "receivingBankAccount": null,
      "confirmationMode": "MANUAL_FALLBACK",
      "fallbackReason": "GRADE_BANK_NOT_CONFIGURED",
      "defaultManualReceivingBankAccountId": 2,
      "defaultManualReceivingBankAccount": { "receivingBankAccountId": 2, "accountNumber": "******6789" },
      "isManualFallbackAvailable": true
    }
  ]
}
```

`fallbackReason` có thể là `COLLECTION_CONFIGURATION_MISSING`, `COLLECTION_MODE_MANUAL_FALLBACK`, `GRADE_BANK_NOT_CONFIGURED`, `GRADE_BANK_INACTIVE`, `SEPAY_BANK_STATUS_UNKNOWN`, hoặc `SEPAY_BANK_INACTIVE`.

## `PUT /api/admin/tuition-grade-bank-accounts`

| Thuộc tính | Giá trị |
| --- | --- |
| Status thành công | `200 OK` |
| Side effect | Cập nhật các mapping được gửi và ghi audit `CONFIGURE_TUITION_GRADE_BANK_ACCOUNT` cho từng mapping thực sự thay đổi |

Body nhận một hoặc nhiều mapping. `grade` là số nguyên từ `1` đến `12`, không được trùng trong cùng request. `receivingBankAccountId` là ID số nguyên dương của tài khoản hiện có hoặc `null` để bỏ gán và bắt buộc fallback về default manual bank.

```json
{
  "mappings": [
    { "grade": 7, "receivingBankAccountId": 3 },
    { "grade": 8, "receivingBankAccountId": null }
  ]
}
```

Response có cùng cấu trúc với `GET`, luôn trả đủ 12 khối sau khi cập nhật. Gán một tài khoản đang tắt hoặc có `sepayStatus` chưa sẵn sàng được phép để cấu hình trước, nhưng response sẽ báo `MANUAL_FALLBACK`; backend không tự xác nhận thanh toán cho mapping đó.

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Body không đúng cấu trúc, grade ngoài 1–12, hoặc ID tài khoản không phải số nguyên dương/null. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission cấu hình mapping theo khối. |
| `404` | Không có mapping grade hoặc `receivingBankAccountId` được gửi không tồn tại. |
| `409` | Cùng một grade xuất hiện nhiều lần trong request. |
