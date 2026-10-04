# Course Class Makeup Options API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Permission: dùng permission CourseClass hiện có, không có permission mới.
  - `GET`: `course-class:get-by-id`.
  - `PUT`: `course-class:update`.
- Cấu hình học bù là quan hệ có hướng **lớp nguồn → lớp đích**: học sinh của lớp nguồn có thể sang học bù ở lớp đích.
- Chỉ các lớp thuộc cùng `courseId` mới liên kết được với nhau. Quan hệ không dùng `weeklySchedule` để suy luận.
- `makeupNote` của `ClassSession` độc lập hoàn toàn với cấu hình này.

## `GET /api/course-classes/:classId/makeup-options`

| Thuộc tính | Giá trị |
| --- | --- |
| Status thành công | `200 OK` |
| Side effect | Không có audit log |

Trả mọi lớp cùng course trừ lớp nguồn, sắp xếp theo `className` rồi `classId`. FE dùng `selected`, `disabled` và `disabledReason` để dựng danh sách chọn.

```json
{
  "success": true,
  "message": "Lấy cấu hình lớp học bù thành công",
  "data": {
    "sourceClassId": 151,
    "courseId": 20,
    "candidates": [
      {
        "classId": 152,
        "className": "Đại 1 lớp 12B",
        "weeklySchedule": "Thứ 4 - 18:00",
        "startDate": "2026-09-01",
        "endDate": "2027-05-31",
        "room": "P402",
        "instructorName": "Nguyễn Ngọc",
        "selected": true,
        "isExpired": false,
        "disabled": false,
        "disabledReason": null
      },
      {
        "classId": 153,
        "className": "Đại 1 lớp 12C",
        "weeklySchedule": null,
        "startDate": "2026-01-05",
        "endDate": "2026-06-30",
        "room": null,
        "instructorName": null,
        "selected": false,
        "isExpired": true,
        "disabled": true,
        "disabledReason": "Lớp đã kết thúc, không thể thêm làm lớp học bù"
      }
    ]
  }
}
```

| Field | Ý nghĩa |
| --- | --- |
| `startDate`, `endDate` | Chuỗi ngày `YYYY-MM-DD` hoặc `null`, không kèm giờ/múi giờ. |
| `weeklySchedule`, `room`, `instructorName` | `null` khi lớp chưa có dữ liệu. |
| `selected` | Lớp đang là lớp học bù của lớp nguồn. |
| `isExpired` | `endDate` nằm trước ngày hiện tại theo `Asia/Ho_Chi_Minh`. Lớp không có `endDate` luôn là `false`. |
| `disabled` | `true` khi **không được thêm mới** lớp này. Lớp đã `selected` luôn có `disabled = false` để vẫn bỏ chọn được, kể cả khi `isExpired = true`; FE nên gắn nhãn hết hạn. |
| `disabledReason` | `null` khi không bị disable. Hiện có hai lý do: lớp đã kết thúc, hoặc thêm lớp này sẽ tạo vòng lặp học bù. Lớp vừa hết hạn vừa tạo vòng lặp trả lý do hết hạn. |

## `PUT /api/course-classes/:classId/makeup-options`

| Thuộc tính | Giá trị |
| --- | --- |
| Status thành công | `200 OK` |
| Side effect | Thay toàn bộ cạnh đi ra từ lớp nguồn và ghi audit `UPDATE_COURSE_CLASS` (resource `COURSE_CLASS`) cùng transaction |

Body thay toàn bộ danh sách lớp học bù của lớp nguồn. Gửi `[]` để xóa hết.

```json
{
  "makeupClassIds": [152, 153, 154]
}
```

Response có cùng cấu trúc với `GET`, phản ánh cấu hình sau khi lưu (message: `Cập nhật cấu hình lớp học bù thành công`).

Quy tắc xử lý, theo thứ tự:

1. Lớp nguồn phải tồn tại.
2. `makeupClassIds` không được chứa ID trùng.
3. `makeupClassIds` không được chứa chính `classId`.
4. Mọi lớp đích phải tồn tại.
5. Mọi lớp đích phải cùng `courseId` với lớp nguồn.
6. Lớp đích chưa nằm trong cấu hình hiện tại và đã kết thúc (`isExpired`) bị từ chối. Lớp đã được chọn vẫn được giữ hoặc bỏ.
7. Graph quan hệ của course sau thay đổi không được có chu trình trực tiếp hoặc gián tiếp. Các lần cập nhật cùng course được tuần tự hóa để hai request đồng thời không cùng tạo vòng lặp.

Toàn bộ thay đổi và audit nằm trong một transaction; bất kỳ lỗi nào cũng không để lại cấu hình dở dang.

Audit snapshot chỉ gồm ID đã sắp xếp tăng dần:

```json
{
  "beforeData": { "makeupClassIds": [152, 153] },
  "afterData": { "makeupClassIds": [152, 154] }
}
```

Nếu tập lớp gửi lên giống hệt cấu hình hiện tại thì API trả cấu hình hiện có, không ghi dữ liệu và không tạo audit.

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Body không đúng cấu trúc (thiếu `makeupClassIds`, không phải mảng, phần tử không phải số nguyên dương); ID trùng; chọn chính lớp nguồn; lớp đích khác course; thêm mới lớp đã kết thúc. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission. |
| `404` | Lớp nguồn không tồn tại, hoặc có lớp đích không tồn tại (message nêu các ID thiếu). |
| `409` | Cấu hình tạo vòng lặp trực tiếp hoặc gián tiếp (`code`: `COURSE_CLASS_MAKEUP_CYCLE`). |

Ví dụ vòng lặp bị từ chối: đã có `B→A` rồi thêm `A→B`; hoặc đã có `B→C`, `C→A` rồi thêm `A→B`.
