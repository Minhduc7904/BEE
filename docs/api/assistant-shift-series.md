# Assistant Shift Series API

Base URL: `/api`. Mọi API yêu cầu `Authorization: Bearer <token>` và permission ghi ở từng endpoint.

## Quy ước response

Mọi response thành công dùng cùng envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Các trường thời gian là ISO 8601. Ví dụ dưới đây dùng `+07:00`; client nên gửi timezone rõ ràng.

## Tài liệu liên quan

- [Assistant Shift](./assistant-shifts.md)
- [Assistant Shift Series](./assistant-shift-series.md)
- [Assistant Shift Assignment](./assistant-shift-assignment.md)

## Assistant Shift Series

### GET `/assistant-shift-series/available`

- Permission: `assistant-shift:get-available-series`.
- Request: không có path, query hoặc body.
- Rule: chỉ trả series có `isLocked = false`; không include danh sách shift.

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách chuỗi ca thành công",
  "data": [{ "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false }]
}
```

### GET `/assistant-shift-series`

- Permission: `assistant-shift:get-all-series`.
- Request: không có path, query hoặc body.
- Rule: trả cả series đang khóa và chưa khóa; không include danh sách shift.

Response `200`:

```json
{
  "success": true,
  "message": "Lấy tất cả chuỗi ca thành công",
  "data": [
    { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false },
    { "assistantShiftSeriesId": 11, "name": "Lịch đã lưu trữ", "isLocked": true }
  ]
}
```

### POST `/assistant-shift-series`

- Permission: `assistant-shift:create-series`.
- Rule: `name` bắt buộc, tối đa 200 ký tự. `isLocked` tùy chọn, mặc định `false`.

Request:

```json
{ "name": "Lịch trợ giảng lớp 11", "isLocked": false }
```

Response `201`:

```json
{
  "success": true,
  "message": "Tạo chuỗi ca thành công",
  "data": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false }
}
```

### PUT `/assistant-shift-series/:id`

- Permission: `assistant-shift:update-series`.
- Path: `id` là số nguyên dương.
- Rule: có thể cập nhật dù series đang khóa.

Request `PUT /assistant-shift-series/10`:

```json
{ "name": "Lịch trợ giảng lớp 11 - học kỳ 1", "isLocked": true }
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật chuỗi ca thành công",
  "data": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11 - học kỳ 1", "isLocked": true }
}
```

### DELETE `/assistant-shift-series/:id`

- Permission: `assistant-shift:delete-series`.
- Rule: có thể xóa dù đang khóa. Database cascade xóa shift và assignment con.

Response `200`:

```json
{ "success": true, "message": "Xóa chuỗi ca thành công", "data": { "deleted": true } }
```


## Thao tác hàng loạt theo Assistant Shift Series

Các API dưới đây là thao tác quản lý, yêu cầu Bearer JWT và permission riêng. `seriesId` phải là ID của Assistant Shift Series tồn tại. Khoảng dùng để tìm ca luôn lấy những ca có `startAt` nằm trong khoảng đóng `startAt <= shift.startAt <= endAt`.

### POST `/api/assistant-shifts/series/:seriesId/copy`

- Permission: `assistant-shift:copy`.
- Status thành công: `201 Created`.
- Khi `copyAssignments = true`, mọi admin trong assignment nguồn phải còn role trợ giảng cấu hình (`ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID`, hiện là `16`); nếu một người không hợp lệ, toàn bộ thao tác copy bị từ chối.
- Sao chép các ca có `startAt` thuộc `[startCopyAt, endCopyAt]` trong đúng series truyền vào.
- Khoảng copy và paste phải có cùng độ dài. Không được có bất kỳ ca nào của series giao với khoảng paste (`shift.startAt < endPasteAt` và `shift.endAt > startPasteAt`).
- Mỗi ca nguồn phải kết thúc không muộn hơn `endCopyAt`; điều này bảo đảm mọi ca mới nằm trọn trong khoảng paste.
- API này chỉ sao chép ca thường. Ca mới giữ `classId`, `name`, `requiredAssistantCount`, `isLocked` và các thời điểm tự đăng ký; mọi trường thời gian được cộng cùng offset `startPasteAt - startCopyAt`. `notes` luôn thành `null`.
- Mọi assignment được sao chép sang ca mới với cùng `adminId`, nhưng `attendanceStatus = PENDING`, `absenceReason = null`, `managerNote = null`.
- Toàn bộ kiểm tra và tạo ca/phân công chạy trong một transaction. Nếu bất kỳ điều kiện nào lỗi, không có ca nào được tạo.

Request:

```http
POST /api/assistant-shifts/series/10/copy
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "startCopyAt": "2026-07-20T00:00:00+07:00",
  "endCopyAt": "2026-07-26T23:59:59+07:00",
  "startPasteAt": "2026-07-27T00:00:00+07:00",
  "endPasteAt": "2026-08-02T23:59:59+07:00",
  "copyAssignments": true
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Sao chép ca trợ giảng thành công",
  "data": { "copiedShiftCount": 3, "copiedAssignmentCount": 5 }
}
```

Lỗi: `400` nếu một trong hai khoảng không hợp lệ, độ dài hai khoảng khác nhau hoặc ca nguồn vượt ra ngoài khoảng copy; `404` nếu series không tồn tại hoặc không có ca nguồn; `409` nếu khoảng paste đã có ca giao nhau.

`copyAssignments` là boolean tùy chọn, mặc định `true`. Gửi `true` để copy cả phân công trợ giảng; gửi `false` để chỉ copy các ca, không tạo assignment nào.

### PUT `/api/assistant-shifts/series/:seriesId/lock`

- Permission: `assistant-shift:lock-by-series`.
- Status thành công: `200 OK`.
- Đặt `isLocked = true` cho tất cả ca của series có `startAt` thuộc khoảng body. Không sửa trạng thái khóa của series.

Request:

```json
{
  "startAt": "2026-07-20T00:00:00+07:00",
  "endAt": "2026-07-26T23:59:59+07:00"
}
```

Response `200`:

```json
{ "success": true, "message": "Khóa các ca trợ giảng thành công", "data": { "updatedCount": 3 } }
```

### PUT `/api/assistant-shifts/series/:seriesId/unlock`

- Permission: `assistant-shift:unlock-by-series`.
- Status thành công: `200 OK`.
- Đặt `isLocked = false` cho tất cả ca thuộc series và khoảng body.

Request:

```json
{
  "startAt": "2026-07-20T00:00:00+07:00",
  "endAt": "2026-07-26T23:59:59+07:00"
}
```

Response `200`:

```json
{ "success": true, "message": "Mở khóa các ca trợ giảng thành công", "data": { "updatedCount": 3 } }
```

### PUT `/api/assistant-shifts/series/:seriesId/self-registration-window`

- Permission: `assistant-shift:set-self-registration-window-by-series`.
- Status thành công: `200 OK`.
- Chọn ca theo `startAt`/`endAt`, sau đó đặt cùng một cửa sổ tự đăng ký cho tất cả ca được chọn. Mỗi mốc có thể là `null`; chỉ khi cả hai có giá trị thì `selfRegistrationCloseAt` phải sau `selfRegistrationOpenAt`.
- API chỉ đặt cửa sổ đăng ký; rule đăng ký vẫn yêu cầu shift và series chưa khóa.

Request:

```json
{
  "startAt": "2026-07-20T00:00:00+07:00",
  "endAt": "2026-07-26T23:59:59+07:00",
  "selfRegistrationOpenAt": "2026-07-15T00:00:00+07:00",
  "selfRegistrationCloseAt": "2026-07-19T23:59:59+07:00"
}
```

Response `200`:

```json
{ "success": true, "message": "Đặt thời gian tự đăng ký ca thành công", "data": { "updatedCount": 3 } }
```

Ba API cập nhật hàng loạt trả `404` khi series không tồn tại và `400` khi `endAt` không sau `startAt`. Nếu không có ca phù hợp, request vẫn thành công với `updatedCount: 0`.
