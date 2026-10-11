# Attendance: `status` và `attendanceType`

`status` và `attendanceType` là hai trường độc lập.

| Trường | Giá trị | Mặc định |
| --- | --- | --- |
| `status` | `PRESENT`, `ABSENT`, `LATE` | bắt buộc khi tạo đơn lẻ; `PRESENT` khi bulk không gửi |
| `attendanceType` | `REGULAR`, `MAKEUP` | `REGULAR` |

Điểm danh học bù có mặt là `status=PRESENT` + `attendanceType=MAKEUP`. `MAKEUP` không còn là giá trị của `status`.

## Response

```json
{
  "status": "PRESENT",
  "statusLabel": "Có mặt",
  "attendanceType": "MAKEUP",
  "attendanceTypeLabel": "Học bù"
}
```

## Endpoint

- `POST /api/attendances`, `POST /api/attendances/bulk/session`, `PUT /api/attendances/:id` nhận `attendanceType` tùy chọn.
  `PUT` chỉ gửi `status` thì giữ nguyên `attendanceType`; chỉ gửi `attendanceType` thì giữ nguyên `status`.
- `GET /api/attendances?attendanceType=REGULAR|MAKEUP`; `attendanceType` là trường sort hợp lệ.
- `GET /api/parent/students/:studentId/schedule` và `.../schedule/:sessionId` trả `attendanceType` trong attendance của buổi học.
- Tính điểm thưởng theo `status` (mặc định `PRESENT`, `LATE`), không theo `attendanceType`. Metadata của log điểm chứa `attendanceType`.

## Migration

`20261004120000_split_attendance_type`: thêm `attendance_type` (mặc định `REGULAR`), chuyển `status='MAKEUP'` thành `status='PRESENT'` + `attendance_type='MAKEUP'`, sau đó mới thu hẹp enum `status`. Không xóa dữ liệu lịch sử. Migration thu hẹp enum sẽ lỗi nếu còn dòng `status='MAKEUP'`.

# Điểm danh / Hủy điểm danh và liên kết học bù

Bản ghi **Vắng** có `makeupByAttendanceId` trỏ tới bản ghi **Có mặt** đã học bù cho nó (một bản ghi Có mặt bù được nhiều buổi vắng). Cặp buổi hợp lệ nằm trong bảng `session_makeup_registrations` (khác lớp, cùng nhóm học bù hiệu lực, cùng tuần Thứ Hai–Chủ Nhật). Trạng thái `LATE` không tham gia liên kết.

## Trường mới trong response điểm danh

| Trường | Ý nghĩa |
| --- | --- |
| `makeupByAttendanceId` | `number \| null`. ID bản ghi Có mặt đã học bù cho buổi vắng này. |
| `isMadeUp` | `true` khi `status = ABSENT` và có `makeupByAttendanceId`. |
| `makeupBy` | Chỉ có ở `GET /attendances/:id`: tóm tắt bản ghi đã bù cho bản ghi này. |
| `madeUpAbsences` | Chỉ có ở `GET /attendances/:id`: mảng tóm tắt các buổi vắng mà bản ghi này đã bù. |

Tóm tắt (`makeupBy`, phần tử `madeUpAbsences`): `{ attendanceId, sessionId, status, sessionName, sessionDate (YYYY-MM-DD), startTime, endTime, classId, className }`.

## POST `/api/attendances/check-in`

Body `{ "sessionId": number, "studentId": number }`. Quyền: `attendance:create` **hoặc** `attendance:update`. Hệ thống tự tính trạng thái và loại điểm danh:

- Đã `PRESENT`: trả nguyên trạng (idempotent).
- `ABSENT`/`LATE`: chuyển `PRESENT`, xóa `makeupByAttendanceId` của chính bản ghi (bản ghi đã bù cho nó giữ `MAKEUP`).
- Chưa có bản ghi: tạo `PRESENT` + `REGULAR`.
- Sau đó nối mọi bản ghi `ABSENT` chưa được bù của cùng học sinh ở các buổi mà buổi này học bù được; nối được ít nhất 1 thì bản ghi thành `MAKEUP`.

Lỗi: `404` buổi/học sinh không tồn tại, `409` khóa học đã kết thúc, `403` học sinh bị vô hiệu hóa. Không gửi tin phụ huynh.

## POST `/api/attendances/:id/cancel-check-in`

Quyền: `attendance:update`. Chỉ khi bản ghi đang `PRESENT` (khác: `409`). Chuyển về `ABSENT`, gỡ các buổi vắng đang trỏ tới bản ghi này (thử nối chúng sang bản ghi Có mặt khác), rồi nối chính bản ghi vừa hủy vào buổi đã học bù nếu có. Bản ghi vừa hủy **giữ** `attendanceType`.

## Response của hai API

`AttendanceResponseDto` của bản ghi sau cập nhật (có `makeupBy`, `madeUpAbsences`) cộng thêm `linkedAbsenceCount`: số buổi vắng vừa được nối (check-in) hoặc vừa bị gỡ (cancel-check-in).

```json
{
  "success": true,
  "message": "Điểm danh thành công",
  "data": {
    "attendanceId": 321,
    "sessionId": 905,
    "studentId": 15,
    "status": "PRESENT",
    "attendanceType": "MAKEUP",
    "makeupByAttendanceId": null,
    "isMadeUp": false,
    "madeUpAbsences": [
      {
        "attendanceId": 300,
        "sessionId": 901,
        "status": "ABSENT",
        "sessionName": "Buổi 13/10",
        "sessionDate": "2026-10-13",
        "startTime": "1970-01-01T11:00:00.000Z",
        "endTime": "1970-01-01T13:00:00.000Z",
        "classId": 154,
        "className": "Toán 10A"
      }
    ],
    "linkedAbsenceCount": 1
  }
}
```

## Các API cũ

`POST /api/attendances`, `POST /api/attendances/bulk/session`, `PUT /api/attendances/:id` và `DELETE /api/attendances/:id` cũng tự nối/gỡ liên kết theo cùng quy tắc (Có mặt → nối buổi vắng; Vắng xuất hiện → nối vào bản ghi Có mặt đã học, ưu tiên bản ghi `MAKEUP` rồi sớm nhất; Có mặt → trạng thái khác hoặc đổi loại về `REGULAR` → gỡ liên kết; xóa bản ghi Có mặt → thử nối lại các buổi vắng). Việc tự gửi tin cho phụ huynh khi tạo/cập nhật/bulk điểm danh **tạm tắt** (`POST /attendances/:id/send-to-parent` thủ công vẫn dùng được; thông báo trong app cho học sinh giữ nguyên).

## Migration

`20261011090000_add_session_makeup_registrations`: thêm cột `attendances.makeup_by_attendance_id` (FK tự tham chiếu, `ON DELETE SET NULL`), bảng `session_makeup_registrations`. Không backfill: dữ liệu cũ chưa có cặp/liên kết; cặp buổi chỉ được tạo từ lúc có thay đổi buổi học/nhóm học bù.
