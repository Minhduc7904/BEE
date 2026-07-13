# Luồng nộp bài tập bằng file cho học sinh

Các API dưới đây yêu cầu access token của học sinh trong header `Authorization: Bearer <token>`. API nộp và nộp lại chỉ dùng được khi `HomeworkContent.type` là `FILE_UPLOAD`; API upload chỉ tạo media riêng cho học sinh.

## 1. Kiểm tra loại bài tập

Lấy danh sách bài tập tại `GET /api/learning-items/student/my-homeworks` hoặc chi tiết learning item tại `GET /api/learning-items/:id/student`. Mỗi `homeworkContent` có trường:

```json
{
  "homeworkContentId": 123,
  "type": "FILE_UPLOAD",
  "dueDate": "2026-07-20T16:59:59.000Z",
  "allowLateSubmit": false
}
```

Chỉ hiển thị luồng upload/nộp file khi `type === "FILE_UPLOAD"`. Dù API upload không ràng buộc loại bài tập, FE nên chỉ gọi nó trong luồng này.

## 2. Upload nhiều file

`POST /api/student/homework-submissions/files`

Gửi `multipart/form-data`, dùng cùng tên field `files` cho từng file. Một request tối đa 10 file, mỗi file tối đa 5 MB.

```ts
const formData = new FormData()
selectedFiles.forEach((file) => formData.append('files', file))

await api.post(
  '/student/homework-submissions/files',
  formData,
)
```

Response thành công (`201`):

```json
{
  "success": true,
  "message": "Tải file bài tập thành công",
  "data": [
    {
      "mediaId": 501,
      "originalName": "bai-lam.pdf",
      "mimeType": "application/pdf",
      "fileSize": 182034,
      "status": "READY"
    }
  ]
}
```

Lưu các `mediaId` từ response. Học sinh chỉ có thể đính kèm file do chính tài khoản đó upload.

## 3. Nộp bài lần đầu

`POST /api/student/homework-submissions`

```json
{
  "homeworkContentId": 123,
  "content": "Em gửi bài làm buổi 1.",
  "mediaIds": [501, 502]
}
```

`content` và `mediaIds` là bắt buộc; `mediaIds` phải có ít nhất một phần tử và không được trùng lặp. Backend tạo `HomeworkSubmit` và tạo `MediaUsage` riêng cho từng media, với `entityType = "HOMEWORK_SUBMIT"`, `fieldName = "ATTACHMENTS"`, `visibility = "PRIVATE"`.

Response thành công (`201`):

```json
{
  "success": true,
  "message": "Nộp bài tập thành công",
  "data": {
    "homeworkSubmitId": 88,
    "homeworkContentId": 123,
    "studentId": 45,
    "content": "Em gửi bài làm buổi 1.",
    "mediaIds": [501, 502],
    "attachments": [
      { "usageId": 901, "mediaId": 501, "entityType": "HOMEWORK_SUBMIT", "fieldName": "ATTACHMENTS" },
      { "usageId": 902, "mediaId": 502, "entityType": "HOMEWORK_SUBMIT", "fieldName": "ATTACHMENTS" }
    ]
  }
}
```

## 4. Nộp lại

`PUT /api/student/homework-submissions/:homeworkContentId`

```json
{
  "content": "Em đã cập nhật bài làm.",
  "mediaIds": [503]
}
```

Request sẽ thay toàn bộ file đính kèm cũ bằng danh sách `mediaIds` mới và cập nhật thời điểm nộp. Chỉ được nộp lại khi bài nộp chưa được chấm (`points` và `gradedAt` chưa có giá trị). Nếu đã chấm, API trả `422`.

## 5. Xem các bài đã nộp của tôi

`GET /api/student/homework-submissions?page=1&limit=20&homeworkContentId=123`

`homeworkContentId` là tùy chọn. Backend luôn lấy học sinh từ token, vì vậy FE không gửi `studentId`.

Response gồm `homeworkSubmits`, trạng thái chấm điểm, `mediaIds` và `attachments`. Mỗi attachment có `media.viewUrl` là presigned URL để xem file; URL mặc định hết hạn sau một giờ.

```json
{
  "success": true,
  "data": {
    "homeworkSubmits": [
      {
        "homeworkSubmitId": 88,
        "homeworkContentId": 123,
        "content": "Em gửi bài làm.",
        "mediaIds": [501],
        "attachments": [
          {
            "mediaId": 501,
            "media": {
              "originalName": "bai-lam.pdf",
              "viewUrl": "https://..."
            }
          }
        ]
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
  }
}
```

## Quy tắc nghiệp vụ

- Bài quá hạn chỉ nộp/nộp lại được khi `allowLateSubmit = true`; nếu không API trả lỗi `400`.
- Ba cờ `updatePointsOnLateSubmit`, `updatePointsOnReSubmit`, `updateMaxPoints` chỉ có ý nghĩa cho `COMPETITION`. Khi tạo hoặc chuyển sang `FILE_UPLOAD`, backend luôn lưu cả ba là `false` và bỏ qua chúng trong request cập nhật.
- API nộp lần đầu và nộp lại kiểm tra học sinh có quyền truy cập lesson/course chứa bài tập và chỉ chấp nhận `FILE_UPLOAD`. API upload chỉ tạo media riêng cho học sinh đăng nhập, sau đó media này mới được dùng để nộp bài.
- Nếu đã nộp lần đầu, gọi `POST` lần nữa sẽ nhận `409`; FE dùng API `PUT` để nộp lại.
