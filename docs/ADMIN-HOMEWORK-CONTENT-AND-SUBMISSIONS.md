# Quy tắc quản trị HomeworkContent và chấm bài

Tất cả API quản trị yêu cầu access token admin và quyền tương ứng.

## HomeworkContent: tạo, cập nhật, xóa

Các endpoint quản lý hiện có:

- `POST /api/homework-contents` — cần `homework-content:create`.
- `PUT /api/homework-contents/:id` — cần `homework-content:update`.
- `DELETE /api/homework-contents/:id` — cần `homework-content:delete`.

### Hai loại bài tập

| `type` | Cách học sinh nộp | Cấu hình admin dùng |
| --- | --- | --- |
| `COMPETITION` | Làm bài qua Competition | Có thể gắn `competitionId`; ba cờ xử lý điểm có hiệu lực. |
| `FILE_UPLOAD` | Upload file và gửi nội dung | Không dùng các cờ xử lý điểm Competition. |

Khi tạo không truyền `type`, backend mặc định `COMPETITION`.

### Request tạo/cập nhật

```json
{
  "learningItemId": 20,
  "type": "FILE_UPLOAD",
  "content": "Nộp file PDF bài tập buổi 1",
  "dueDate": "2026-07-20T16:59:59.000Z",
  "allowLateSubmit": true
}
```

Với `FILE_UPLOAD`, ba field sau bị backend bỏ qua và luôn được lưu là `false`:

- `updatePointsOnLateSubmit`
- `updatePointsOnReSubmit`
- `updateMaxPoints`


Với `COMPETITION`, ba field trên mới được đọc để xử lý điểm từ lượt làm Competition. `allowLateSubmit` áp dụng cho cả hai loại: nếu đã quá `dueDate`, học sinh chỉ có thể nộp/nộp lại khi giá trị này là `true`.

Khi đổi từ `COMPETITION` sang `FILE_UPLOAD`, backend tự reset ba cờ xử lý điểm về `false`.

### Xóa

Xóa HomeworkContent sẽ xóa các HomeworkSubmit liên quan theo cascade. Với `FILE_UPLOAD`, backend gỡ các MediaUsage `HOMEWORK_SUBMIT/ATTACHMENTS` trước khi xóa; file Media gốc vẫn được giữ lại, không bị xóa vật lý.

## Xem bài nộp của học sinh

`GET /api/admin/homework-submissions/:homeworkSubmitId`

Quyền: `homework-submit:get-by-id`.

Response phân nhánh theo `type`:

- `FILE_UPLOAD`: `fileSubmission.attachments[]` chứa metadata media và `media.viewUrl` là presigned URL để admin xem file.
- `COMPETITION`: `competitionSubmission` chứa đầy đủ lượt làm Competition, câu trả lời, câu hỏi, đáp án và lời giải. Nội dung media trong đề cũng đã được xử lý thành URL xem tạm thời.

Ví dụ file submission:

```json
{
  "success": true,
  "data": {
    "type": "FILE_UPLOAD",
    "homeworkSubmit": {
      "homeworkSubmitId": 88,
      "studentId": 45,
      "content": "Em gửi bài làm.",
      "points": null
    },
    "fileSubmission": {
      "attachments": [
        {
          "mediaId": 501,
          "entityType": "HOMEWORK_SUBMIT",
          "fieldName": "ATTACHMENTS",
          "media": {
            "originalName": "bai-lam.pdf",
            "viewUrl": "https://..."
          }
        }
      ]
    }
  }
}
```

## Chấm bài nộp file

`PATCH /api/admin/homework-submissions/:homeworkSubmitId/grade`

Quyền: `homework-submit:grade`.

Chỉ chấm được HomeworkSubmit có `HomeworkContent.type = FILE_UPLOAD`. Backend lấy `adminId` từ token, không nhận `graderId` từ request.

```json
{
  "points": 85,
  "feedback": "Trình bày tốt, cần bổ sung câu 3."
}
```

Điểm hợp lệ từ `0` đến `100`, có thể là số thập phân (ví dụ `85.5`); chấm thành công sẽ lưu `points`, `feedback`, `graderId`, `gradedAt`. Sau khi đã chấm, học sinh không thể gọi API nộp lại.

### Gỡ chấm điểm

`PATCH /api/admin/homework-submissions/:homeworkSubmitId/ungrade`

Quyền: `homework-submit:grade`. Chỉ áp dụng cho bài `FILE_UPLOAD` đã được chấm. API không nhận body và xóa toàn bộ `points`, `gradedAt`, `graderId`, `feedback`. Sau khi thành công, học sinh có thể nộp lại bài.

## Cập nhật nhận xét cho file đính kèm

`PATCH /api/admin/homework-submissions/:homeworkSubmitId/media/:mediaId/alt`

Quyền: `homework-submit:grade`. API chấp nhận mọi loại file đang được gắn vào HomeworkSubmit có type `FILE_UPLOAD`; không thể sửa alt của file không thuộc bài nộp.

```json
{
  "alt": "Bài trình bày sạch, bố cục đẹp nhưng phần chữ hơi nhỏ."
}
```

`alt` có tối đa 255 ký tự và được lưu trực tiếp trên Media. Khi gọi lại `GET /api/admin/homework-submissions/:id` hoặc `GET /api/student/homework-submissions`, trường `attachments[].media.alt` sẽ có nhận xét mới này.
