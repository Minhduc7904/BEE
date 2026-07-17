# API Homework Submit từ Competition

Tài liệu này mô tả ba API quản trị dùng để tạo hoặc cập nhật `HomeworkSubmit` từ một lượt làm bài Competition. Mọi endpoint đều có tiền tố `/api` và yêu cầu access token của admin.

Chỉ các lượt Competition có `status = SUBMITTED` mới được chọn. Một `competitionSubmitId` chỉ được liên kết với tối đa một `HomeworkSubmit`.

## Quy ước response

### Response thành công

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Response lỗi

```json
{
  "success": false,
  "message": "...",
  "statusCode": 400,
  "timestamp": "2026-07-17T15:30:00.000Z",
  "path": "/api/homework-submits/..."
}
```

## Giá trị `selection`

| Giá trị | Lượt thi được chọn |
| --- | --- |
| `LATEST` | Lượt đã nộp mới nhất. Đây là giá trị mặc định. |
| `OLDEST` | Lượt đã nộp sớm nhất. |
| `HIGHEST_SCORE` | Lượt có `totalPoints` cao nhất; nếu bằng điểm, chọn lượt nộp mới hơn. |
| `SPECIFIC` | Lượt có đúng `competitionSubmitId` truyền vào. |

## 1. Tạo homework submit từ Competition

`POST /api/homework-submits/from-competition`

Quyền yêu cầu: `homework-submit:create`.

API tìm một lượt thi `SUBMITTED` của học sinh theo `selection`, sau đó tạo `HomeworkSubmit`. Nếu học sinh đã có homework submit cho `homeworkContentId` này, bản ghi hiện có sẽ được cập nhật thay vì tạo thêm bản ghi mới.

`autoFeedback` mặc định là `true`: hệ thống dùng cùng luồng AI nhận xét được sử dụng khi nộp Competition. Khi là `false`, client bắt buộc truyền `manualFeedback`; HomeworkSubmit được tạo/cập nhật với điểm từ Competition và nhận xét thủ công đó, không gọi AI.

### Request body

```json
{
  "homeworkContentId": 12,
  "studentId": 45,
  "selection": "HIGHEST_SCORE",
  "autoFeedback": true
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `homeworkContentId` | number | Có | HomeworkContent đích. Giá trị phải lớn hơn 0. |
| `studentId` | number | Có | Học sinh sở hữu lượt thi. Giá trị phải lớn hơn 0. |
| `selection` | enum | Không | Một trong các giá trị ở bảng trên. Mặc định `LATEST`. |
| `competitionSubmitId` | number | Có điều kiện | Bắt buộc khi `selection = SPECIFIC`. Phải là lượt `SUBMITTED` của chính `studentId`. |
| `autoFeedback` | boolean | Không | Mặc định `true`. Bật/tắt việc tạo lại nhận xét AI. |
| `manualFeedback` | string | Có điều kiện | Bắt buộc, không được rỗng khi `autoFeedback = false`. |

Ví dụ chọn một lượt cụ thể và không chạy AI:

```json
{
  "homeworkContentId": 12,
  "studentId": 45,
  "selection": "SPECIFIC",
  "competitionSubmitId": 98,
  "autoFeedback": false,
  "manualFeedback": "Em cần giải thích rõ hơn cách làm ở câu 3."
}
```

### Response `201 Created`

```json
{
  "success": true,
  "message": "Đã tạo homework submit từ lượt thi đã nộp",
  "data": {
    "action": "created",
    "autoFeedback": true,
    "homeworkSubmit": {
      "homeworkSubmitId": 201,
      "homeworkContentId": 12,
      "studentId": 45,
      "competitionSubmitId": 98,
      "content": "Nộp bài qua cuộc thi #7 (submit #98)",
      "points": 85,
      "feedback": "...",
      "submitAt": "2026-07-17T15:30:00.000Z",
      "createdAt": "2026-07-17T15:30:00.000Z",
      "updatedAt": "2026-07-17T15:30:00.000Z"
    },
    "competitionSubmit": {
      "competitionSubmitId": 98,
      "competitionId": 7,
      "studentId": 45,
      "attemptNumber": 2,
      "status": "SUBMITTED",
      "totalPoints": 85,
      "maxPoints": 100,
      "submittedAt": "2026-07-17T15:20:00.000Z"
    }
  }
}
```

`action` có giá trị `created` hoặc `updated`.

## 2. Lấy các lượt Competition đã nộp của một học sinh

`GET /api/homework-submits/students/:studentId/competition-attempts`

Quyền yêu cầu: `competition-submit:get-all`.

API trả về toàn bộ lượt Competition của học sinh có trạng thái `SUBMITTED`, sắp xếp theo thời gian nộp giảm dần. API này phù hợp để frontend hiển thị danh sách trước khi gọi API tạo/cập nhật với `selection = SPECIFIC`.

### Path parameter

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `studentId` | number | ID học sinh, phải là số nguyên lớn hơn 0. |

### Response `200 OK`

```json
{
  "success": true,
  "message": "Lấy danh sách lượt thi đã nộp thành công",
  "data": {
    "studentId": 45,
    "total": 2,
    "competitionSubmits": [
      {
        "competitionSubmitId": 98,
        "competitionId": 7,
        "studentId": 45,
        "attemptNumber": 2,
        "status": "SUBMITTED",
        "startedAt": "2026-07-17T15:00:00.000Z",
        "submittedAt": "2026-07-17T15:20:00.000Z",
        "timeSpentSeconds": 1200,
        "totalPoints": 85,
        "maxPoints": 100,
        "isInProgress": false,
        "isSubmitted": true,
        "isAbandoned": false,
        "isGraded": false,
        "hasScore": true,
        "scorePercentage": 85,
        "timeSpentDisplay": "20 phút"
      }
    ]
  }
}
```

## 3. Đổi Competition Submit cho Homework Submit

`PATCH /api/homework-submits/:id/competition-submit`

Quyền yêu cầu: `homework-submit:update`.

API đổi lượt Competition đang gắn với HomeworkSubmit. `studentId` được lấy từ HomeworkSubmit hiện có, nên client không được truyền `studentId`. Lượt được chọn phải thuộc về học sinh đó và có trạng thái `SUBMITTED`.

Khi `autoFeedback = true` (mặc định), hệ thống cập nhật điểm, liên kết Competition và tạo lại nhận xét bằng AI. Khi `autoFeedback = false`, client bắt buộc truyền `manualFeedback`; hệ thống lưu nguyên văn nhận xét thủ công này và không gọi AI.

### Path parameter

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `id` | number | ID của HomeworkSubmit cần cập nhật. |

### Request body: tự động nhận xét lại

```json
{
  "selection": "LATEST",
  "autoFeedback": true
}
```

### Request body: nhận xét thủ công

```json
{
  "selection": "SPECIFIC",
  "competitionSubmitId": 98,
  "autoFeedback": false,
  "manualFeedback": "Em làm tốt phần thuật toán, cần bổ sung phần giải thích ở câu 3."
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| --- | --- | --- | --- |
| `selection` | enum | Không | Tiêu chí chọn lượt thi. Mặc định `LATEST`. |
| `competitionSubmitId` | number | Có điều kiện | Bắt buộc khi `selection = SPECIFIC`. |
| `autoFeedback` | boolean | Không | Mặc định `true`. Nếu `true`, nhận xét AI được tạo lại. |
| `manualFeedback` | string | Có điều kiện | Bắt buộc, không được rỗng khi `autoFeedback = false`. |

### Response `200 OK`

```json
{
  "success": true,
  "message": "Đã cập nhật homework submit theo lượt thi đã chọn",
  "data": {
    "autoFeedback": false,
    "homeworkSubmit": {
      "homeworkSubmitId": 201,
      "homeworkContentId": 12,
      "studentId": 45,
      "competitionSubmitId": 98,
      "content": "Nộp bài qua cuộc thi #7 (submit #98)",
      "points": 85,
      "feedback": "Em làm tốt phần thuật toán, cần bổ sung phần giải thích ở câu 3.",
      "submitAt": "2026-07-17T15:30:00.000Z",
      "updatedAt": "2026-07-17T15:35:00.000Z"
    },
    "competitionSubmit": {
      "competitionSubmitId": 98,
      "competitionId": 7,
      "studentId": 45,
      "attemptNumber": 2,
      "status": "SUBMITTED",
      "totalPoints": 85,
      "maxPoints": 100,
      "submittedAt": "2026-07-17T15:20:00.000Z"
    }
  }
}
```

## Lỗi nghiệp vụ thường gặp

| HTTP | Khi nào xảy ra |
| --- | --- |
| `400 Bad Request` | Request không hợp lệ; thiếu `competitionSubmitId` khi chọn `SPECIFIC`; hoặc thiếu `manualFeedback` khi tắt AI. |
| `404 Not Found` | Không tìm thấy HomeworkSubmit; học sinh chưa có lượt `SUBMITTED`; hoặc lượt chỉ định không thuộc về học sinh. |
| `409 Conflict` | `competitionSubmitId` đã được liên kết với HomeworkSubmit khác. |
| `401 Unauthorized` / `403 Forbidden` | Thiếu access token hoặc không có quyền tương ứng. |
