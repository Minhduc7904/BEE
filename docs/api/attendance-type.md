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
