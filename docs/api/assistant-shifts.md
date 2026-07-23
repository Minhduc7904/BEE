# Assistant Shift API

Base URL: `/api`. Mọi API yêu cầu `Authorization: Bearer <token>` và permission ghi ở từng endpoint.

## Quy ước response

Mọi response thành công dùng cùng envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Các trường thời gian là ISO 8601. Ví dụ dưới đây dùng `+07:00`; client nên gửi timezone rõ ràng.

### Shift trong API list và detail

Hai API list và hai API chi tiết Assistant Shift **luôn include** đầy đủ `series`, `courseClass`, `assignments` và `assignments[].admin`. `assignments[].admin.avatarUrl` là presigned URL của avatar, có hiệu lực 24 giờ và chỉ xuất hiện khi trợ giảng có avatar ở trạng thái sẵn sàng. Nếu `classId` là `null` thì `courseClass` cũng là `null`; nếu ca chưa có trợ giảng, `assignments` là `[]`.

```json
{
  "assistantShiftId": 101,
  "assistantShiftSeriesId": 10,
  "classId": 12,
  "name": "Ca tối thứ Hai",
  "notes": "Hỗ trợ điểm danh và ổn định lớp",
  "startAt": "2026-07-20T18:00:00.000+07:00",
  "endAt": "2026-07-20T20:00:00.000+07:00",
  "isLocked": false,
  "selfRegistrationOpenAt": "2026-07-15T00:00:00.000+07:00",
  "selfRegistrationCloseAt": "2026-07-19T23:59:59.000+07:00",
  "requiredAssistantCount": 2,
  "series": {
    "assistantShiftSeriesId": 10,
    "name": "Lịch trợ giảng lớp 11",
    "isLocked": false
  },
  "courseClass": {
    "classId": 12,
    "courseId": 4,
    "className": "Lớp 11A1",
    "startDate": "2026-07-01T00:00:00.000+07:00",
    "endDate": "2026-12-31T00:00:00.000+07:00",
    "weeklySchedule": "Thứ Hai, Thứ Tư, Thứ Sáu",
    "room": "P.301",
    "instructorId": 8,
    "status": "active",
    "durationInDays": 183,
    "isScheduled": true
  },
  "assignments": [
    {
      "assistantShiftId": 101,
      "adminId": 25,
      "attendanceStatus": "PENDING",
      "absenceReason": null,
      "managerNote": "Hỗ trợ giáo viên",
      "admin": {
        "adminId": 25,
        "userId": 60,
        "fullName": "Nguyễn Minh Đức",
        "avatarUrl": "https://minio.example.com/..."
      }
    }
  ]
}
```

Lỗi chung: `401/403` thiếu JWT hoặc permission; `404` không tìm thấy; `400` sai validation/rule nghiệp vụ; `409` trùng đăng ký. Response lỗi theo error filter chung của hệ thống.

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
{ "success": true, "message": "Tạo chuỗi ca thành công", "data": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false } }
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
{ "success": true, "message": "Cập nhật chuỗi ca thành công", "data": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11 - học kỳ 1", "isLocked": true } }
```

### DELETE `/assistant-shift-series/:id`

- Permission: `assistant-shift:delete-series`.
- Rule: có thể xóa dù đang khóa. Database cascade xóa shift và assignment con.

Response `200`:

```json
{ "success": true, "message": "Xóa chuỗi ca thành công", "data": { "deleted": true } }
```

## List và detail Assistant Shift

`startAt` và `endAt` bắt buộc ở hai API list, nhận ngày ISO `YYYY-MM-DD`. Server lấy từ **00:00 của ngày trước `startAt`** đến **23:59:59.999 của `endAt`**. Ví dụ `startAt=2026-07-16&endAt=2026-07-18` truy vấn từ `2026-07-15 00:00` đến hết ngày 18.

### GET `/assistant-shifts/series/:seriesId/available?startAt=...&endAt=...`

- Permission: `assistant-shift:get-available-by-series`.
- Rule: series phải tồn tại. Nếu series khóa, response là `data: []`. Khi series chưa khóa, chỉ lấy shift có `isLocked = false`.
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`.

Request:

```http
GET /api/assistant-shifts/series/10/available?startAt=2026-07-16&endAt=2026-07-18
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách ca thành công",
  "data": [{ "assistantShiftId": 101, "assistantShiftSeriesId": 10, "classId": 12, "name": "Ca tối thứ Hai", "startAt": "2026-07-20T18:00:00.000+07:00", "endAt": "2026-07-20T20:00:00.000+07:00", "isLocked": false, "requiredAssistantCount": 2, "series": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false }, "courseClass": { "classId": 12, "courseId": 4, "className": "Lớp 11A1", "status": "active", "isScheduled": true }, "assignments": [] }]
}
```

`404` khi series không tồn tại; `400` khi thiếu/sai `startAt`, `endAt`.

### GET `/assistant-shifts/series/:seriesId?startAt=...&endAt=...`

- Permission: `assistant-shift:get-all-by-series`.
- Query `adminId` là tùy chọn. Có truyền thì chỉ trả các ca mà admin đó có assignment; không truyền thì trả toàn bộ ca trong series.
- Rule: series phải tồn tại. Không lọc theo trạng thái khóa của series hoặc shift.
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`.

Request:

```http
GET /api/assistant-shifts/series/10?startAt=2026-07-16&endAt=2026-07-18&adminId=25
```

Response `200`: envelope giống API available; `data` có thể gồm cả shift `isLocked: true` và series `isLocked: true`.

### GET `/assistant-shifts/:id/available`

- Permission: `assistant-shift:get-available-detail`.
- Rule: chỉ trả nếu **cả shift và series** chưa khóa. Shift/series khóa được xử lý như không tồn tại (`404`).
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`.

Request:

```http
GET /api/assistant-shifts/101/available
```

Response `200`:

```json
{ "success": true, "message": "Lấy chi tiết ca thành công", "data": { "assistantShiftId": 101, "assistantShiftSeriesId": 10, "classId": 12, "name": "Ca tối thứ Hai", "isLocked": false, "series": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false }, "courseClass": { "classId": 12, "courseId": 4, "className": "Lớp 11A1", "status": "active", "isScheduled": true }, "assignments": [{ "assistantShiftId": 101, "adminId": 25, "attendanceStatus": "PENDING", "absenceReason": null, "managerNote": null, "admin": { "adminId": 25, "userId": 60, "fullName": "Nguyễn Minh Đức" } }] } }
```

### GET `/assistant-shifts/:id`

- Permission: `assistant-shift:get-detail`.
- Rule: không áp dụng rule khóa.
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`.

Request: `GET /api/assistant-shifts/101`.

Response `200`: envelope và cấu trúc `data` giống API detail available ở trên, kể cả shift/series đang khóa.

## Quản lý Assistant Shift

### POST `/assistant-shifts`

- Permission: `assistant-shift:create`.
- Rule: series phải tồn tại; `assistantShiftSeriesId`, `name`, `startAt`, `endAt`, `requiredAssistantCount` bắt buộc; `requiredAssistantCount >= 1`; `endAt` phải sau `startAt`. `classId` có thể bỏ qua hoặc `null`.

Request:

```json
{
  "assistantShiftSeriesId": 10,
  "classId": 12,
  "name": "Ca tối thứ Hai",
  "notes": "Hỗ trợ điểm danh",
  "startAt": "2026-07-20T18:00:00+07:00",
  "endAt": "2026-07-20T20:00:00+07:00",
  "requiredAssistantCount": 2,
  "isLocked": false,
  "selfRegistrationOpenAt": "2026-07-15T00:00:00+07:00",
  "selfRegistrationCloseAt": "2026-07-19T23:59:59+07:00"
}
```

Response `201`:

```json
{ "success": true, "message": "Tạo ca thành công", "data": { "assistantShiftId": 101, "assistantShiftSeriesId": 10, "classId": 12, "name": "Ca tối thứ Hai", "notes": "Hỗ trợ điểm danh", "startAt": "2026-07-20T18:00:00.000+07:00", "endAt": "2026-07-20T20:00:00.000+07:00", "isLocked": false, "selfRegistrationOpenAt": "2026-07-15T00:00:00.000+07:00", "selfRegistrationCloseAt": "2026-07-19T23:59:59.000+07:00", "requiredAssistantCount": 2 } }
```

### PUT `/assistant-shifts/:id`

- Permission: `assistant-shift:update`.
- Rule: mọi trường body tùy chọn; nếu đổi `assistantShiftSeriesId` thì series mới phải tồn tại; sau khi ghép dữ liệu cũ/mới, `endAt` phải sau `startAt`. Không có rule chặn theo khóa.

Request `PUT /assistant-shifts/101`:

```json
{ "requiredAssistantCount": 3, "isLocked": true, "notes": "Không mở tự đăng ký trong tuần này" }
```

Response `200`:

```json
{ "success": true, "message": "Cập nhật ca thành công", "data": { "assistantShiftId": 101, "assistantShiftSeriesId": 10, "classId": 12, "name": "Ca tối thứ Hai", "notes": "Không mở tự đăng ký trong tuần này", "isLocked": true, "requiredAssistantCount": 3 } }
```

### DELETE `/assistant-shifts/:id`

- Permission: `assistant-shift:delete`.
- Rule: xóa được dù shift/series khóa; assignment con bị cascade.

Response `200`:

```json
{ "success": true, "message": "Xóa ca thành công", "data": { "deleted": true } }
```

## Tự đăng ký và chấm công

### POST `/assistant-shifts/:id/register`

- Permission: `assistant-shift:register`.
- Chỉ admin có role trợ giảng cấu hình (`ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID`, hiện là `16`) mới được tự đăng ký.
- Request: không body. `adminId` lấy từ JWT, client không gửi `adminId`.
- Rule: shift và series phải chưa khóa; `selfRegistrationOpenAt` và `selfRegistrationCloseAt` đều phải có; thời điểm hiện tại phải nằm trong khoảng đó; không được có assignment trùng `(shiftId, adminId)`.

Request:

```http
POST /api/assistant-shifts/101/register
```

Response `201`:

```json
{ "success": true, "message": "Đăng ký ca thành công", "data": { "assistantShiftId": 101, "adminId": 25, "attendanceStatus": "PENDING", "absenceReason": null, "managerNote": null } }
```

Lỗi riêng: `404` khi shift/series khóa hoặc không tồn tại; `400` ngoài thời gian tự đăng ký; `409` khi đã đăng ký.

### DELETE `/assistant-shifts/:id/register`

- Permission: `assistant-shift:cancel-registration`.
- Request: không có body. `adminId` luôn lấy từ JWT, nên chỉ có thể hủy assignment của chính trợ giảng đang đăng nhập.
- Rule: giống API đăng ký: shift và series đều chưa khóa; `selfRegistrationOpenAt` và `selfRegistrationCloseAt` cùng tồn tại; thời điểm hiện tại nằm trong khoảng tự đăng ký. Assignment `(shiftId, adminId)` phải tồn tại.

Request:

```http
DELETE /api/assistant-shifts/101/register
Authorization: Bearer <token>
```

Response `200`:

```json
{ "success": true, "message": "Hủy đăng ký ca thành công", "data": { "cancelled": true } }
```

Lỗi: `404` khi ca/series khóa, không tồn tại hoặc trợ giảng chưa đăng ký; `400` khi ngoài thời gian tự đăng ký.

### GET `/api/assistant-shifts/:id/check-in`

- Public endpoint: không dùng JWT và không yêu cầu permission.
- Query bắt buộc: `token` là token ngẫu nhiên của đúng assignment. API bắt buộc khớp cả `:id` (ID ca) và `token`; token không được trả trong các API danh sách/lịch.
- Rule: chỉ điểm danh trong khoảng từ `startAt - 45 phút` đến hết `endAt` **và assignment phải còn `PENDING`**. Điểm danh thành công chuyển trạng thái thành `PRESENT`; gọi lại link sau đó hiển thị trang thất bại.

Request:

```http
GET /api/assistant-shifts/101/check-in?token=<64-character-token>
```

Response luôn là trang `text/html` có icon ở giữa, tiêu đề và thông báo trạng thái; không trả JSON.

Các trường hợp token sai, ca không còn `PENDING`, chưa đến giờ hoặc đã kết thúc đều hiển thị trang HTML thất bại. Không gửi `Authorization` header.

## Email nhắc lịch và token điểm danh

- Khi repository tạo assignment (tự đăng ký, quản lý phân công hoặc sao chép), hệ thống tự sinh `token` ngẫu nhiên 64 ký tự và đặt `shouldSendReminderEmail = true`.
- Assignment cũ giữ `token = null` và `shouldSendReminderEmail = false`, nên không được job gửi email xử lý.
- Background job `ASSISTANT_SHIFT_REMINDER` chạy mỗi 5 phút (`0 */5 * * * *`, `Asia/Ho_Chi_Minh`), dùng database lease lock và tạo một `BackgroundJobRun` `RUNNING → SUCCEEDED/FAILED` cho mỗi lần chạy thực tế.
- Với assignment `PENDING`, email điểm danh được gửi đúng một lần khi thời điểm hiện tại nằm trong `[startAt - 45 phút, endAt]`. Subject có dạng `16:00 - 18:00 Lớp đại 12A - Bạn có lịch đi trợ giảng`.
- Nếu đã quá `endAt` mà assignment vẫn `PENDING`, job chuyển trạng thái thành `ABSENT`, lý do `Không điểm danh trước khi ca kết thúc`, rồi gửi đúng một email thông báo vắng. Email provider lỗi sẽ được đánh dấu để job lần sau thử lại.
- Hai mốc `checkInReminderSentAt` và `absenceEmailSentAt` đảm bảo từng loại email không bị gửi trùng; `shouldSendReminderEmail` chỉ là cờ cho phép assignment mới tham gia luồng email.
- Template ở `src/infrastructure/templates/assistant-shift-reminder.template.ts`. Nút **Điểm danh** gọi chính xác `GET /api/assistant-shifts/:assistantShiftId/check-in?token=:token`; base URL lấy từ `API_BASE_URL`.
- Cấu hình bắt buộc: `RESEND_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `MAIL_REPLY_TO`, `MAIL_ENABLED=true`, và `API_BASE_URL` phải là URL public của backend có hậu tố `/api`.

## Phân công do quản lý thực hiện

Ba API này không áp dụng rule khóa của shift/series: quản lý có thể phân công, sửa hoặc xóa trong mọi trạng thái.

### POST `/assistant-shifts/:shiftId/assignments`

- Permission: `assistant-shift:assign`.
- Admin được phân công phải có role trợ giảng cấu hình (`ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID`, hiện là `16`).
- Rule: shift và admin phải tồn tại; cặp `(shiftId, adminId)` là duy nhất. `attendanceStatus` nhận `PENDING`, `PRESENT`, `ABSENT`.

Request:

```json
{ "adminId": 25, "attendanceStatus": "PENDING", "absenceReason": null, "managerNote": "Hỗ trợ giáo viên" }
```

Response `201`:

```json
{ "success": true, "message": "Phân công trợ giảng thành công", "data": { "assistantShiftId": 101, "adminId": 25, "attendanceStatus": "PENDING", "absenceReason": null, "managerNote": "Hỗ trợ giáo viên" } }
```

### PUT `/assistant-shifts/:shiftId/assignments/:adminId`

- Permission: `assistant-shift:update-assignment`.
- Rule: mọi trường body tùy chọn; assignment phải tồn tại.

Request `PUT /assistant-shifts/101/assignments/25`:

```json
{ "attendanceStatus": "ABSENT", "absenceReason": "Nghỉ ốm", "managerNote": "Đã báo trước" }
```

Response `200`:

```json
{ "success": true, "message": "Cập nhật phân công thành công", "data": { "assistantShiftId": 101, "adminId": 25, "attendanceStatus": "ABSENT", "absenceReason": "Nghỉ ốm", "managerNote": "Đã báo trước" } }
```

### DELETE `/assistant-shifts/:shiftId/assignments/:adminId`

- Permission: `assistant-shift:delete-assignment`.
- Rule: assignment phải tồn tại.

Response `200`:

```json
{ "success": true, "message": "Xóa phân công thành công", "data": { "deleted": true } }
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
- Ca mới giữ `classId`, `name`, `requiredAssistantCount`, `isLocked` và các thời điểm tự đăng ký; mọi trường thời gian được cộng cùng offset `startPasteAt - startCopyAt`. `notes` luôn thành `null`.
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
- Chọn ca theo `startAt`/`endAt`, sau đó đặt cùng một khoảng tự đăng ký cho tất cả ca được chọn. `selfRegistrationCloseAt` phải sau `selfRegistrationOpenAt`.
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

## API lịch và thống kê của trợ giảng

Hai API dưới đây dành cho trợ giảng đang đăng nhập. `adminId` luôn lấy từ Bearer JWT, không nhận từ path, query hay body. Cả hai có thể xem dữ liệu của chính mình dù `AssistantShiftSeries.isLocked` hoặc `AssistantShift.isLocked` là `true`.

### GET `/api/assistant-shifts/my`

- Permission: `assistant-shift:get-my-schedule`.
- Status thành công: `200 OK`.
- Bắt buộc truyền `startAt` và `endAt`; không truyền `seriesId`.
- Chỉ trả các ca mà admin hiện tại có `AssistantShiftAssignment`. Mỗi ca chỉ include assignment của admin hiện tại, đồng thời include `series` và `courseClass` (nếu ca gắn lớp).
- Không áp dụng rule lọc khóa; API chỉ để xem lịch, không cho đăng ký/chỉnh sửa.

Request:

```http
GET /api/assistant-shifts/my?startAt=2026-07-16&endAt=2026-07-18
Authorization: Bearer <token>
```

Khoảng ngày dùng cùng quy ước với API list ca: `startAt=2026-07-16` được quy về `00:00` ngày 15, còn `endAt=2026-07-18` được quy về `23:59:59.999` ngày 18. Vì vậy FE nên truyền ngày cần xem theo cùng cách đang dùng ở danh sách ca.

Response `200`:

```json
{
  "success": true,
  "message": "Lấy lịch trợ giảng của bạn thành công",
  "data": [
    {
      "assistantShiftId": 41,
      "assistantShiftSeriesId": 10,
      "classId": 7,
      "name": "Lớp 11A1 - ca tối",
      "notes": "Có thể đã khóa nhưng vẫn hiển thị trong lịch cá nhân.",
      "startAt": "2026-07-16T11:00:00.000Z",
      "endAt": "2026-07-16T13:00:00.000Z",
      "isLocked": true,
      "selfRegistrationOpenAt": "2026-07-10T00:00:00.000Z",
      "selfRegistrationCloseAt": "2026-07-15T16:59:59.999Z",
      "requiredAssistantCount": 2,
      "series": {
        "assistantShiftSeriesId": 10,
        "name": "Lịch trợ giảng khối 11",
        "isLocked": true
      },
      "assignments": [
        {
          "assistantShiftId": 41,
          "adminId": 12,
          "attendanceStatus": "PRESENT",
          "absenceReason": null,
          "managerNote": null,
          "admin": {
            "adminId": 12,
            "userId": 45,
            "fullName": "Nguyễn Minh Đức",
            "avatarUrl": "https://minio.example.com/..."
          }
        }
      ],
      "courseClass": {
        "classId": 7,
        "name": "11A1"
      }
    }
  ]
}
```

Lỗi FE cần xử lý: `400` khi thiếu/sai ngày hoặc khoảng ngày không hợp lệ; `401/403` khi chưa đăng nhập/thiếu permission. Không có `404` chỉ vì ca hoặc series bị khóa.

### GET `/api/assistant-shifts/statistics`

- Permission: `assistant-shift:get-all-by-series`.
- Dùng cho quản lý xem thống kê tất cả trợ giảng có role `16` còn hiệu lực trong khoảng `startAt`/`endAt`.
- Báo cáo lấy ca có `startAt` nằm trong khoảng cùng quy ước với API danh sách ca. Trợ giảng không có assignment trong khoảng vẫn xuất hiện với tất cả số bằng `0`.
- `registeredShiftCount` đếm mọi assignment; `workedHours` chỉ tính `PRESENT`; `absentHours` chỉ tính `ABSENT`; `pendingHours` chỉ tính `PENDING`. Số giờ là tổng `(endAt - startAt)`, làm tròn tối đa hai chữ số thập phân.

Request:

```http
GET /api/assistant-shifts/statistics?startAt=2026-07-01&endAt=2026-07-31
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy thống kê trợ giảng thành công",
  "data": {
    "startAt": "2026-06-30T17:00:00.000Z",
    "endAt": "2026-07-31T16:59:59.999Z",
    "assistants": [
      {
        "adminId": 25,
        "userId": 60,
        "fullName": "Nguyễn Minh Đức",
        "registeredShiftCount": 10,
        "workedHours": 16.5,
        "absentHours": 2,
        "pendingHours": 3.5
      }
    ]
  }
}
```

Lỗi: `400` khi thiếu/sai `startAt`, `endAt` hoặc khoảng không hợp lệ; `401/403` khi chưa đăng nhập hoặc không có permission.

### GET `/api/assistant-shifts/my/monthly-statistics`

- Permission: `assistant-shift:get-my-monthly-statistics`.
- Status thành công: `200 OK`.
- Không có query hay body. Tháng được xác định theo thời điểm server xử lý request, từ ngày đầu tháng `00:00:00` đến hết ngày cuối tháng.
- Chỉ xét assignment của admin hiện tại và các ca có `startAt` trong tháng này; ca/series khóa vẫn được tính.
- `workedShiftCount` và `workedHours` chỉ tính assignment có `attendanceStatus = PRESENT`.
- `absentShiftCount` và `absentHours` chỉ tính assignment có `attendanceStatus = ABSENT`.
- `PENDING` không tính vào bất kỳ chỉ số nào. Số giờ là `(endAt - startAt)` của từng ca, cộng dồn và làm tròn tối đa hai chữ số thập phân.

Request:

```http
GET /api/assistant-shifts/my/monthly-statistics
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy thống kê ca trợ giảng tháng này thành công",
  "data": {
    "month": "2026-07",
    "workedShiftCount": 8,
    "workedHours": 16.5,
    "absentShiftCount": 1,
    "absentHours": 2
  }
}
```

Lỗi FE cần xử lý: `401/403` khi chưa đăng nhập hoặc thiếu permission. Nếu không có assignment phù hợp, API vẫn trả `200` với tất cả số lượng và số giờ bằng `0`.
