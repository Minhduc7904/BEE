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
  "isBaseShift": false,
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

## Tài liệu liên quan

- [Assistant Shift](./assistant-shifts.md)
- [Assistant Shift Series](./assistant-shift-series.md)
- [Assistant Shift Assignment](./assistant-shift-assignment.md)

## List và detail Assistant Shift

Query tùy chọn `attendanceStatus=PENDING|PRESENT|ABSENT` áp dụng cho mọi API trong phần này có trả `assignments`: mảng assignment chỉ chứa trạng thái đã chọn. Với API lịch cá nhân, danh sách ca cũng chỉ còn các ca có assignment của chính người dùng ở trạng thái đó.

`startAt` và `endAt` bắt buộc ở hai API list, nhận ngày ISO `YYYY-MM-DD`. Server lấy từ **00:00 của ngày trước `startAt`** đến **23:59:59.999 của `endAt`**. Ví dụ `startAt=2026-07-16&endAt=2026-07-18` truy vấn từ `2026-07-15 00:00` đến hết ngày 18.

### GET `/assistant-shifts/series/:seriesId/available?startAt=...&endAt=...`

- Permission: `assistant-shift:get-available-by-series`.
- Rule: series phải tồn tại. Nếu series khóa, response là `data: []`. Khi series chưa khóa, chỉ lấy shift có `isLocked = false` và `isBaseShift = false`.
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`. Each assignment includes `isPendingExchangeRequest`: `true` when that assignment belongs to an unexpired `PENDING` swap or transfer request; otherwise `false`. `nextExchangeRequestAllowedAt` is the ISO 8601 time FE may enable a new exchange action after the displayed pending request expires and its 10-minute cooldown ends; it is `null` when no request is pending.

Request:

```http
GET /api/assistant-shifts/series/10/available?startAt=2026-07-16&endAt=2026-07-18&attendanceStatus=PENDING
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách ca thành công",
  "data": [
    {
      "assistantShiftId": 101,
      "assistantShiftSeriesId": 10,
      "classId": 12,
      "name": "Ca tối thứ Hai",
      "startAt": "2026-07-20T18:00:00.000+07:00",
      "endAt": "2026-07-20T20:00:00.000+07:00",
      "isLocked": false,
      "requiredAssistantCount": 2,
      "series": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false },
      "courseClass": { "classId": 12, "courseId": 4, "className": "Lớp 11A1", "status": "active", "isScheduled": true },
      "assignments": []
    }
  ]
}
```

`404` khi series không tồn tại; `400` khi thiếu/sai `startAt`, `endAt`.

### GET `/assistant-shifts/series?startAt=...&endAt=...`

- Permission: `assistant-shift:get-all-by-series`.
- Body bắt buộc: `assistantShiftSeriesIds` là mảng ID chuỗi ca dương, không rỗng và không trùng. Có thể truyền nhiều ID trong một request.
- Query `adminId` là tùy chọn. Có truyền thì chỉ trả các ca mà admin đó có assignment; không truyền thì trả toàn bộ ca thuộc các series đã chọn.
- Rule: mọi series trong body phải tồn tại. Không lọc theo trạng thái khóa của series hoặc shift, nhưng luôn loại ca cơ sở (`isBaseShift = true`). Dùng API ca cơ sở riêng để lấy dữ liệu mẫu.
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`.

Request:

```http
GET /api/assistant-shifts/series?startAt=2026-07-16&endAt=2026-07-18&adminId=25&attendanceStatus=PRESENT
Content-Type: application/json
```

```json
{
  "assistantShiftSeriesIds": [2, 10]
}
```

Response `200`: envelope giống API available; `data` có thể gồm cả shift `isLocked: true` và series `isLocked: true`.

`GET /api/assistant-shifts/series/:seriesId` không còn được hỗ trợ; FE chuyển sang body mảng `assistantShiftSeriesIds` kể cả khi chỉ truy vấn một series.

### GET `/assistant-shifts/:id/available`

- Permission: `assistant-shift:get-available-detail`.
- Rule: chỉ trả nếu shift không phải ca cơ sở và **cả shift và series** chưa khóa. Ca cơ sở hoặc shift/series khóa được xử lý như không tồn tại (`404`).
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`. Each assignment includes `isPendingExchangeRequest` and `nextExchangeRequestAllowedAt` using the same rule as the available-shifts list API.

Request:

```http
GET /api/assistant-shifts/101/available?attendanceStatus=PENDING
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy chi tiết ca thành công",
  "data": {
    "assistantShiftId": 101,
    "assistantShiftSeriesId": 10,
    "classId": 12,
    "name": "Ca tối thứ Hai",
    "isLocked": false,
    "series": { "assistantShiftSeriesId": 10, "name": "Lịch trợ giảng lớp 11", "isLocked": false },
    "courseClass": { "classId": 12, "courseId": 4, "className": "Lớp 11A1", "status": "active", "isScheduled": true },
    "assignments": [
      {
        "assistantShiftId": 101,
        "adminId": 25,
        "attendanceStatus": "PENDING",
        "absenceReason": null,
        "managerNote": null,
        "admin": { "adminId": 25, "userId": 60, "fullName": "Nguyễn Minh Đức" }
      }
    ]
  }
}
```

### GET `/assistant-shifts/:id`

- Permission: `assistant-shift:get-detail`.
- Rule: không áp dụng rule khóa.
- Include: `series`, `courseClass`, `assignments`, `assignments[].admin`.

Request: `GET /api/assistant-shifts/101?attendanceStatus=ABSENT`.

Response `200`: envelope và cấu trúc `data` giống API detail available ở trên, kể cả shift/series đang khóa.

## Ca cơ sở

Ca cơ sở là mẫu lịch duy nhất trong tuần **20/07/2026 (Thứ Hai) đến 26/07/2026 (Chủ Nhật)**. `weekday` nhận `1..7`, tương ứng Thứ Hai đến Chủ Nhật. Ca cơ sở không nhận hoặc cập nhật `isLocked`, `selfRegistrationOpenAt`, `selfRegistrationCloseAt`.

### GET `/assistant-shifts/series/:seriesId/base`

- Permission: `assistant-shift:get-all-by-series`.
- Không có query ngày; luôn trả toàn bộ ca cơ sở của series, kèm `series`, `courseClass`, `assignments` và `assignments[].admin`.

### POST `/assistant-shifts/base`

- Permission: `assistant-shift:create`.
- `assistantShiftSeriesId` được gửi trong body. `startAt` và `endAt` được server dựng từ `weekday`, `startTime`, `endTime`; client không gửi ngày.

```json
{
  "assistantShiftSeriesId": 10,
  "classId": 12,
  "name": "Ca tối thứ Hai",
  "weekday": 1,
  "startTime": "18:00",
  "endTime": "20:00",
  "requiredAssistantCount": 2
}
```

### PUT `/assistant-shifts/:id/base`

- Permission: `assistant-shift:update`.
- Chỉ áp dụng cho ca cơ sở. Client chỉ có thể đổi giờ/phút bằng `startTime`/`endTime`; ngày trong tuần giữ nguyên. Có thể đổi `classId`, `name`, `notes`, `requiredAssistantCount`.

```json
{ "startTime": "18:30", "endTime": "20:30" }
```

### DELETE `/assistant-shifts/:id/base`

- Permission: `assistant-shift:delete`.
- Chỉ xóa ca cơ sở. API xóa ca thường `DELETE /assistant-shifts/:id` sẽ từ chối ca cơ sở.

### POST `/assistant-shifts/base/copy`

- Permission: `assistant-shift:copy`.
- `ids` là danh sách ID ca cơ sở cần sao chép. `startPasteAt` và `endPasteAt` phải cùng tuần Thứ Hai–Chủ Nhật, ví dụ `2026-07-27` đến `2026-08-02`.
- Ca được tạo là ca thường (`isBaseShift = false`), `isLocked = false`, không có cửa sổ tự đăng ký.
- `notes` của ca cơ sở được copy sang ca thường mới. `copyAssignments` mặc định `true`; khi bật, copy admin được gắn. `copyAssignmentAttendanceStatus` mặc định `false`; khi bật cùng `copyAssignments`, assignment mới giữ attendance status của assignment nguồn. Lý do vắng và ghi chú quản lý luôn không copy.

```json
{
  "ids": [101, 102],
  "startPasteAt": "2026-07-27T00:00:00+07:00",
  "endPasteAt": "2026-08-02T23:59:59+07:00",
  "copyAssignments": true,
  "copyAssignmentAttendanceStatus": false
}
```

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
  "isBaseShift": false,
  "selfRegistrationOpenAt": "2026-07-15T00:00:00+07:00",
  "selfRegistrationCloseAt": "2026-07-19T23:59:59+07:00"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Tạo ca thành công",
  "data": {
    "assistantShiftId": 101,
    "assistantShiftSeriesId": 10,
    "classId": 12,
    "name": "Ca tối thứ Hai",
    "notes": "Hỗ trợ điểm danh",
    "startAt": "2026-07-20T18:00:00.000+07:00",
    "endAt": "2026-07-20T20:00:00.000+07:00",
    "isLocked": false,
    "selfRegistrationOpenAt": "2026-07-15T00:00:00.000+07:00",
    "selfRegistrationCloseAt": "2026-07-19T23:59:59.000+07:00",
    "requiredAssistantCount": 2
  }
}
```

### PUT `/assistant-shifts/:id`

- Permission: `assistant-shift:update`.
- Rule: chỉ cập nhật ca thường; nếu đổi `assistantShiftSeriesId` thì series mới phải tồn tại; sau khi ghép dữ liệu cũ/mới, `endAt` phải sau `startAt`. Không có rule chặn theo khóa.

Request `PUT /assistant-shifts/101`:

```json
{ "requiredAssistantCount": 3, "isLocked": true, "notes": "Không mở tự đăng ký trong tuần này" }
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật ca thành công",
  "data": {
    "assistantShiftId": 101,
    "assistantShiftSeriesId": 10,
    "classId": 12,
    "name": "Ca tối thứ Hai",
    "notes": "Không mở tự đăng ký trong tuần này",
    "isLocked": true,
    "requiredAssistantCount": 3
  }
}
```

### DELETE `/assistant-shifts/:id`

- Permission: `assistant-shift:delete`.
- Rule: xóa được dù shift/series khóa; assignment con bị cascade.

Response `200`:

```json
{ "success": true, "message": "Xóa ca thành công", "data": { "deleted": true } }
```
