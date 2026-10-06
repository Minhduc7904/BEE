# Course Class Makeup Group API

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Permission: dùng permission CourseClass hiện có, không có permission mới.
  - `GET`: `course-class:get-by-id`.
  - `PUT`: `course-class:update`.
- **Nhóm học bù**: tập các lớp cùng `courseId` có thể học bù cho nhau. Học sinh của một lớp trong nhóm được sang học bù ở mọi lớp còn lại của nhóm.
- Bảng chỉ lưu nhóm và các `class_id` thuộc nhóm; việc các lớp trong nhóm phải cùng `courseId` do API kiểm tra.
- Một lớp thuộc **tối đa một nhóm**. Nhóm có hiệu lực khi có **ít nhất 2 lớp**; nhóm còn dưới 2 lớp (ví dụ do một lớp bị xóa) được bỏ qua khi đọc.
- Nhóm là một thực thể chung: sửa từ thẻ của bất kỳ lớp nào trong nhóm đều áp dụng cho **cả nhóm**. Bỏ một lớp khỏi danh sách nghĩa là lớp đó rời nhóm.
- Quan hệ không dùng `weeklySchedule` để suy luận. `makeupNote` của `ClassSession` độc lập hoàn toàn với nhóm học bù.
- Phía Parent, `makeupOptions` của chi tiết buổi học là các lớp còn lại trong nhóm của lớp chưa kết thúc (theo ngày `Asia/Ho_Chi_Minh`).

## `GET /api/course-classes/:classId/makeup-group`

| Thuộc tính | Giá trị |
| --- | --- |
| Status thành công | `200 OK` |
| Side effect | Không có audit log |

Trả mọi lớp cùng khóa học trừ lớp nguồn, sắp xếp theo `className` rồi `classId`. FE dùng `selected`, `disabled` và `disabledReason` để dựng danh sách chọn.

```json
{
  "success": true,
  "message": "Lấy nhóm lớp học bù thành công",
  "data": {
    "sourceClassId": 151,
    "courseId": 20,
    "groupId": 3,
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
        "classId": 154,
        "className": "Đại 1 lớp 12D",
        "weeklySchedule": null,
        "startDate": "2026-01-05",
        "endDate": "2026-06-30",
        "room": null,
        "instructorName": null,
        "selected": false,
        "isExpired": true,
        "disabled": true,
        "disabledReason": "Lớp đã kết thúc, không thể thêm vào nhóm học bù"
      }
    ]
  }
}
```

| Field | Ý nghĩa |
| --- | --- |
| `groupId` | ID nhóm của lớp nguồn; `null` khi lớp chưa thuộc nhóm nào. |
| `startDate`, `endDate` | Chuỗi ngày `YYYY-MM-DD` hoặc `null`, không kèm giờ/múi giờ. |
| `weeklySchedule`, `room`, `instructorName` | `null` khi lớp chưa có dữ liệu. |
| `selected` | Lớp đang cùng nhóm với lớp nguồn. |
| `isExpired` | `endDate` nằm trước ngày hiện tại theo `Asia/Ho_Chi_Minh`. Lớp không có `endDate` luôn là `false`. |
| `disabled` | `true` khi **không được thêm** lớp này vào nhóm. Lớp đã `selected` luôn có `disabled = false` để vẫn bỏ chọn được, kể cả khi `isExpired = true`; FE nên gắn nhãn hết hạn. |
| `disabledReason` | `null` khi không bị disable. Hai lý do: lớp đã kết thúc, hoặc lớp đã thuộc nhóm học bù khác (kèm tên các lớp trong nhóm đó, tối đa 3 tên). Lớp vừa hết hạn vừa ở nhóm khác trả lý do hết hạn. |

## `PUT /api/course-classes/:classId/makeup-group`

| Thuộc tính | Giá trị |
| --- | --- |
| Status thành công | `200 OK` |
| Side effect | Thêm/bớt thành viên của nhóm (tạo nhóm mới khi cần, giải tán nhóm khi hết lớp bạn) và ghi audit `UPDATE_COURSE_CLASS` (resource `COURSE_CLASS`) cùng transaction |

Body đặt các lớp cùng nhóm với lớp nguồn. Nhóm sau khi lưu gồm lớp nguồn và các lớp trong danh sách. Gửi `[]` để bỏ mọi lớp bạn: nhóm bị giải tán và tất cả lớp của nhóm cũ (kể cả lớp nguồn) trở thành chưa thuộc nhóm nào.

```json
{
  "makeupClassIds": [152, 153, 154]
}
```

Response có cùng cấu trúc với `GET`, phản ánh trạng thái sau khi lưu (message: `Cập nhật nhóm lớp học bù thành công`).

Quy tắc xử lý, theo thứ tự:

1. Lớp nguồn phải tồn tại.
2. `makeupClassIds` không được chứa ID trùng.
3. `makeupClassIds` không được chứa chính `classId`.
4. Mọi lớp trong danh sách phải tồn tại.
5. Mọi lớp trong danh sách phải cùng `courseId` với lớp nguồn.
6. Lớp đang thuộc một nhóm học bù **khác** nhóm của lớp nguồn bị từ chối (`409`). Muốn chuyển lớp đó, trước hết đưa nó ra khỏi nhóm cũ.
7. Lớp chưa cùng nhóm với lớp nguồn và đã kết thúc (`isExpired`) bị từ chối. Lớp đã trong nhóm vẫn được giữ hoặc bỏ.

Các lớp bị bớt khỏi danh sách rời nhóm và trở thành chưa thuộc nhóm nào; chúng không tự lập nhóm mới với nhau.

Toàn bộ thay đổi và audit nằm trong một transaction `READ COMMITTED`; bất kỳ lỗi nào cũng không để lại cấu hình dở dang. Hai request đồng thời cùng muốn một lớp vào hai nhóm khác nhau thì chỉ một request thành công, request còn lại nhận `409` (`code`: `COURSE_CLASS_MAKEUP_GROUP_CONFLICT`) và cần tải lại.

Audit snapshot chỉ gồm ID nhóm và ID lớp đã sắp xếp tăng dần:

```json
{
  "beforeData": { "makeupGroupId": 3, "makeupGroupClassIds": [151, 152, 153] },
  "afterData": { "makeupGroupId": 3, "makeupGroupClassIds": [151, 152, 154] }
}
```

Nếu tập lớp bạn gửi lên giống hệt tập hiện tại thì API trả trạng thái hiện có, không ghi dữ liệu và không tạo audit.

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Body không đúng cấu trúc (thiếu `makeupClassIds`, không phải mảng, phần tử không phải số nguyên dương); ID trùng; chọn chính lớp nguồn; lớp khác khóa học; thêm mới lớp đã kết thúc. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission. |
| `404` | Lớp nguồn không tồn tại, hoặc có lớp trong danh sách không tồn tại (message nêu các ID thiếu). |
| `409` | Có lớp đang thuộc nhóm học bù khác, hoặc bị xung đột với một lần lưu khác diễn ra đồng thời (`code`: `COURSE_CLASS_MAKEUP_GROUP_CONFLICT`). |
