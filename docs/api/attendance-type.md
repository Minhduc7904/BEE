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

`POST /api/attendances`, `POST /api/attendances/bulk/session`, `PUT /api/attendances/:id` và `DELETE /api/attendances/:id` cũng tự nối/gỡ liên kết theo cùng quy tắc (Có mặt → nối buổi vắng; Vắng xuất hiện → nối vào bản ghi Có mặt đã học, ưu tiên bản ghi `MAKEUP` rồi sớm nhất; Có mặt → trạng thái khác hoặc đổi loại về `REGULAR` → gỡ liên kết; xóa bản ghi Có mặt → thử nối lại các buổi vắng). Việc tự gửi tin cho phụ huynh khi tạo/cập nhật/bulk điểm danh **tạm tắt** (`POST /attendances/:id/send-to-parent` thủ công vẫn dùng được; thông báo trong app cho học sinh giữ nguyên, riêng bulk không còn gửi in-app cho học sinh vì đã chuyển sang job thông báo theo mốc buổi học bên dưới).

## Migration

`20261011090000_add_session_makeup_registrations`: thêm cột `attendances.makeup_by_attendance_id` (FK tự tham chiếu, `ON DELETE SET NULL`), bảng `session_makeup_registrations`. Không backfill: dữ liệu cũ chưa có cặp/liên kết; cặp buổi chỉ được tạo từ lúc có thay đổi buổi học/nhóm học bù.

## Thông báo điểm danh

Thông báo được xếp hàng qua outbox nghiệp vụ (`business_notification_outbox`); relay và dispatcher gửi theo kênh: in-app, push FCM (chỉ phụ huynh) và Zalo OA (tin CS tới `students.parent_zalo_id`).

| Sự kiện | Phụ huynh (in-app + push + Zalo OA) | Học sinh (in-app) |
| --- | --- | --- |
| Mốc `start + 15 phút` (job) | "Đến HH:mm con chưa có mặt tại lớp" | "Bạn chưa có mặt ở buổi ..." |
| Mốc hết giờ (job) | "Hôm nay con vắng buổi học ..." (kèm lịch học bù nếu có) | "Bạn đã vắng buổi ..." |
| `POST /attendances/check-in` chuyển sang Có mặt | "Con đã đến lớp lúc ..." (thêm "(học bù)" nếu là học bù) | Giữ thông báo hiện có |
| `POST /attendances/:id/cancel-check-in` | "Trạng thái điểm danh đã được cập nhật: Vắng mặt" | Giữ thông báo hiện có |
| `PUT /attendances/:id`, `POST /attendances`, bulk | Không gửi | Giữ như hiện tại (bulk không còn gửi) |

Quy tắc job `ATTENDANCE_SESSION_NOTIFIER` (cron mỗi phút, múi giờ Asia/Ho_Chi_Minh):

- Chỉ quét buổi có `session_date` là hôm nay (giờ VN); buổi của ngày trước không bị gửi bù.
- Đối tượng: bản ghi `ABSENT` có `makeup_by_attendance_id = null` tại thời điểm chạy. PRESENT, LATE và buổi vắng đã được học bù không nhận tin.
- Mỗi mốc gửi một lần mỗi buổi, đánh dấu bằng `class_sessions.absent_reminder_notified_at` và `absence_summary_notified_at` (cập nhật có điều kiện cột đang null). Mốc đã qua mà chưa gửi sẽ được gửi bù trong ngày.
- Nếu đã qua cả hai mốc mà chưa gửi lần nào: đánh dấu cả hai nhưng chỉ gửi tin vắng.
- Học sinh được thêm vắng sau khi mốc đã chạy thì không nhận tin của mốc đó.
- Đổi `sessionDate`/`startTime`/`endTime` của buổi: dấu của các mốc mà theo giờ mới vẫn chưa tới được đặt lại về null.
- Giờ buổi học tính theo quy ước admin: `start_time`/`end_time` lưu giờ-trong-ngày UTC của instant thật; giờ VN = UTC + 7.

Biến môi trường liên quan: `NOTIFICATION_PUSH_ENABLED` (bật push), `FIREBASE_ENABLED`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (FCM), `ZALO_APP_ID` và token Zalo OA (`ZALO_OA_SECRET_KEY`, access token lưu theo app) cho kênh Zalo OA.

Migration `20261012090000_add_class_session_attendance_notifications`: thêm hai cột dấu vào `class_sessions` (nullable, không backfill), thêm giá trị `ATTENDANCE_SESSION_NOTIFIER` vào enum `background_jobs.code` và seed job. Lưu ý: buổi của hôm triển khai có mốc đã qua sẽ được gửi bù ngay ở lần quét đầu tiên.
