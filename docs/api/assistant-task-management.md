# Assistant task management API

Tài liệu này mô tả API quản lý công việc và sản phẩm của trợ giảng.

Base URL: `/api`

Mọi endpoint trong tài liệu đều cần JWT:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Phân biệt đối tượng sử dụng

| Nhãn | Ai sử dụng | Ý nghĩa |
| --- | --- | --- |
| **Người phân công / quản trị** | Người có permission quản lý tương ứng | Tạo, phân công, sửa, xóa task; xem toàn bộ dữ liệu; tạo/sửa/xóa product của bất kỳ trợ giảng nào; gắn/gỡ product không bị ràng buộc ownership. |
| **Trợ giảng** | Chính trợ giảng đang đăng nhập | Chỉ làm việc với product do mình sở hữu và task được gán cho chính mình. API self-service luôn có đường dẫn `/me`; không được truyền `assistantId` trong body. |

`taskType` chỉ nhận một trong các giá trị: `BTVN`, `VIDEO`, `BTTL`, `BAI_CHAM`.

`status` chỉ nhận: `PENDING`, `IN_PROGRESS`, `COMPLETED`.

Các mốc thời gian phải là ISO-8601, ví dụ `2026-08-15T17:00:00.000Z`.

## Cấu trúc response dùng chung

### Response một bản ghi

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

### Response phân trang

```json
{
  "success": true,
  "message": "...",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

### Response lỗi

```json
{
  "success": false,
  "message": "Bạn không sở hữu sản phẩm này",
  "statusCode": 403,
  "timestamp": "2026-07-31T08:00:00.000Z",
  "path": "/api/assistant-task-products/me/101"
}
```

Các lỗi validation trả `400`; không tìm thấy trả `404`; gắn trùng product vào cùng task trả `409`; vi phạm trạng thái task hoặc xóa product còn gắn task trả `422`.

---

# 1. API công việc (`AssistantTask`)

Các API trong phần này chỉ dành cho **người phân công / quản trị**. Không có API self-service để trợ giảng tự tạo hoặc tự sửa task.

## 1.1 Tạo task

`POST /api/assistant-tasks`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task:create`.
- Mục đích: tạo task nháp, task mẫu hoặc task đã gán trợ giảng.
- `courseId`, `assistantId`, `taskName`, `taskType`, `deadlineAt`, `completedAt`, `note` đều có thể bỏ qua hoặc là `null` khi phù hợp.
- Nếu có `courseId` hoặc `assistantId`, hệ thống kiểm tra bản ghi tương ứng tồn tại.
- Nếu truyền `status: "COMPLETED"` nhưng không truyền `completedAt`, server tự ghi thời điểm hiện tại.

Request:

```json
{
  "courseId": 12,
  "assistantId": 7,
  "taskName": "Chấm bài kiểm tra chương 3",
  "taskType": "BAI_CHAM",
  "status": "PENDING",
  "isBaseTask": false,
  "deadlineAt": "2026-08-15T17:00:00.000Z",
  "note": "Chấm và phản hồi trước hạn"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Tạo công việc trợ giảng thành công",
  "data": {
    "assistantTaskId": 31,
    "courseId": 12,
    "assistantId": 7,
    "taskName": "Chấm bài kiểm tra chương 3",
    "taskType": "BAI_CHAM",
    "status": "PENDING",
    "isBaseTask": false,
    "deadlineAt": "2026-08-15T17:00:00.000Z",
    "completedAt": null,
    "note": "Chấm và phản hồi trước hạn",
    "createdAt": "2026-07-31T08:00:00.000Z",
    "updatedAt": "2026-07-31T08:00:00.000Z"
  }
}
```

## 1.2 Lấy danh sách task

`GET /api/assistant-tasks`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task:get-all`.
- `startAt` và `endAt` lọc theo `deadlineAt`; `startAt` không được lớn hơn `endAt`.
- `productId` chỉ trả các task đã gắn product đó.
- `includeProducts=true` trả product đi qua bảng many-to-many submission. Mỗi product kèm `examName`, `solutionYoutubeUrl`, `examFileName` và `examSolutionFileName`. `solutionYoutubeUrl` lấy trực tiếp từ `Exam.solutionYoutubeUrl`. Hai tên file được tra từ `MediaUsage` của exam với `entityType=EXAM`, tương ứng `fieldName=EXAM_FILE` và `SOLUTION_FILE` (cũng đọc dữ liệu cũ `EXAM_SOLUTION_FILE`); nếu không có URL, usage hoặc file thì trả `null`.

Query parameters:

| Tên | Kiểu | Mô tả |
| --- | --- | --- |
| `page`, `limit` | number | Phân trang, mặc định `1` và `10`. |
| `courseId`, `assistantId`, `productId` | number | Lọc theo khóa học, trợ giảng hoặc product. |
| `taskName` | string | Lọc chính xác tên task. |
| `taskType` | enum | `BTVN`, `VIDEO`, `BTTL`, `BAI_CHAM`. |
| `status` | enum | `PENDING`, `IN_PROGRESS`, `COMPLETED`. |
| `isBaseTask` | boolean | Lọc task mẫu. |
| `startAt`, `endAt` | ISO date | Khoảng `deadlineAt`. |
| `includeProducts` | boolean | Bao gồm mảng `products`. |

Ví dụ request: `GET /api/assistant-tasks?assistantId=7&taskType=BAI_CHAM&startAt=2026-08-01T00:00:00.000Z&endAt=2026-08-31T23:59:59.999Z&includeProducts=true`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách công việc trợ giảng thành công",
  "data": [
    {
      "assistantTaskId": 31,
      "courseId": 12,
      "assistantId": 7,
      "taskName": "Chấm bài kiểm tra chương 3",
      "taskType": "BAI_CHAM",
      "status": "COMPLETED",
      "isBaseTask": false,
      "deadlineAt": "2026-08-15T17:00:00.000Z",
      "completedAt": "2026-08-10T08:00:00.000Z",
      "note": "Chấm và phản hồi trước hạn",
      "createdAt": "2026-07-31T08:00:00.000Z",
      "updatedAt": "2026-08-10T08:00:00.000Z",
      "products": [
        {
          "assistantTaskProductId": 101,
          "assistantId": 7,
          "examId": 50,
          "examName": "Kiểm tra chương 3",
          "solutionYoutubeUrl": "https://youtube.com/watch?v=exam-solution-50",
          "name": "Đề kiểm tra chương 3 đã chấm",
          "quantity": 30,
          "examFileName": "de-kiem-tra-chuong-3.pdf",
          "examSolutionFileName": "loi-giai-chuong-3.pdf",
          "createdAt": "2026-08-10T08:00:00.000Z",
          "updatedAt": "2026-08-10T08:00:00.000Z"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## 1.3 Lấy chi tiết task

`GET /api/assistant-tasks/:assistantTaskId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task:get-by-id`.
- Response luôn bao gồm mảng `products` (có thể rỗng).

Ví dụ request: `GET /api/assistant-tasks/31`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy công việc trợ giảng thành công",
  "data": {
    "assistantTaskId": 31,
    "courseId": 12,
    "assistantId": 7,
    "taskName": "Chấm bài kiểm tra chương 3",
    "taskType": "BAI_CHAM",
    "status": "COMPLETED",
    "isBaseTask": false,
    "deadlineAt": "2026-08-15T17:00:00.000Z",
    "completedAt": "2026-08-10T08:00:00.000Z",
    "note": "Chấm và phản hồi trước hạn",
    "createdAt": "2026-07-31T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z",
    "products": []
  }
}
```

## 1.4 Sửa task

`PUT /api/assistant-tasks/:assistantTaskId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task:update`.
- Body là partial update; chỉ gửi field cần đổi.
- Nếu task đang `COMPLETED`, không được đổi `assistantId`.
- Nếu task đã có ít nhất một submission/product, không được đổi `status`.
- `assistantId: null` hoặc `courseId: null` dùng để bỏ gán trợ giảng hoặc khóa học, trừ ràng buộc trạng thái nêu trên.

Request:

```json
{
  "taskName": "Chấm bài kiểm tra chương 3 - lớp A",
  "deadlineAt": "2026-08-16T17:00:00.000Z",
  "note": "Ưu tiên phản hồi các bài dưới 5 điểm"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật công việc trợ giảng thành công",
  "data": {
    "assistantTaskId": 31,
    "courseId": 12,
    "assistantId": 7,
    "taskName": "Chấm bài kiểm tra chương 3 - lớp A",
    "taskType": "BAI_CHAM",
    "status": "COMPLETED",
    "isBaseTask": false,
    "deadlineAt": "2026-08-16T17:00:00.000Z",
    "completedAt": "2026-08-10T08:00:00.000Z",
    "note": "Ưu tiên phản hồi các bài dưới 5 điểm",
    "createdAt": "2026-07-31T08:00:00.000Z",
    "updatedAt": "2026-08-10T09:00:00.000Z"
  }
}
```

Ví dụ lỗi `422` khi đổi assistant của task đã hoàn thành:

```json
{
  "success": false,
  "message": "Không thể đổi trợ giảng của công việc đã hoàn thành",
  "statusCode": 422,
  "timestamp": "2026-08-10T09:00:00.000Z",
  "path": "/api/assistant-tasks/31"
}
```

## 1.5 Xóa task

`DELETE /api/assistant-tasks/:assistantTaskId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task:delete`.
- Xóa cứng task và toàn bộ submission của task. Product vẫn còn để dùng cho task khác.

Ví dụ request: `DELETE /api/assistant-tasks/31`

Response `200`:

```json
{
  "success": true,
  "message": "Xóa công việc trợ giảng thành công"
}
```

---

# 2. API sản phẩm (`AssistantTaskProduct`)

Product luôn có một owner là trợ giảng (`assistantId`) và liên kết tới một exam khi được tạo từ API. Hệ thống kiểm tra `Exam.createdBy === assistantId` khi tạo.

## 2.1 Trợ giảng tạo product của mình

`POST /api/assistant-task-products/me`

- Đối tượng: **Trợ giảng**.
- Permission: `assistant-task-product:create-my`.
- Owner được lấy từ access token; không nhận `assistantId`.
- Không được gửi `quantity`; global validation sẽ từ chối field không thuộc DTO.

Request:

```json
{
  "examId": 50,
  "name": "Đề kiểm tra chương 3 đã chấm"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Tạo sản phẩm của tôi thành công",
  "data": {
    "assistantTaskProductId": 101,
    "assistantId": 7,
    "examId": 50,
    "name": "Đề kiểm tra chương 3 đã chấm",
    "quantity": null,
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z"
  }
}
```

Ví dụ lỗi `403` khi exam không do trợ giảng hiện tại tạo:

```json
{
  "success": false,
  "message": "Đề thi không được tạo bởi trợ giảng sở hữu sản phẩm",
  "statusCode": 403,
  "timestamp": "2026-08-10T08:00:00.000Z",
  "path": "/api/assistant-task-products/me"
}
```

## 2.2 Quản trị tạo product cho một trợ giảng

`POST /api/assistant-task-products/assistants/:assistantId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product:create-for-assistant`.
- `assistantId` là trợ giảng nhận ownership, lấy từ path.
- `quantity` chỉ endpoint quản trị này được phép truyền; chấp nhận `0`, số nguyên dương hoặc `null`.

Request:

```json
{
  "examId": 50,
  "name": "Đề kiểm tra chương 3 đã chấm",
  "quantity": 30
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Tạo sản phẩm cho trợ giảng thành công",
  "data": {
    "assistantTaskProductId": 101,
    "assistantId": 7,
    "examId": 50,
    "name": "Đề kiểm tra chương 3 đã chấm",
    "quantity": 30,
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z"
  }
}
```

## 2.3 Trợ giảng lấy product của mình

`GET /api/assistant-task-products/me`

- Đối tượng: **Trợ giảng**.
- Permission: `assistant-task-product:get-my`.
- Hệ thống tự lọc theo `assistantId` trong token; query `assistantId` nếu gửi sẽ không thay đổi scope.
- `startAt/endAt` lọc theo `createdAt`; `includeTasks=true` trả các task đã gắn product.

Ví dụ request: `GET /api/assistant-task-products/me?startAt=2026-08-01T00:00:00.000Z&endAt=2026-08-31T23:59:59.999Z&includeTasks=true`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm trợ giảng thành công",
  "data": [
    {
      "assistantTaskProductId": 101,
      "assistantId": 7,
      "examId": 50,
      "name": "Đề kiểm tra chương 3 đã chấm",
      "quantity": null,
      "createdAt": "2026-08-10T08:00:00.000Z",
      "updatedAt": "2026-08-10T08:00:00.000Z",
      "tasks": [
        {
          "assistantTaskId": 31,
          "courseId": 12,
          "assistantId": 7,
          "taskName": "Chấm bài kiểm tra chương 3",
          "taskType": "BAI_CHAM",
          "status": "COMPLETED",
          "deadlineAt": "2026-08-15T17:00:00.000Z",
          "completedAt": "2026-08-10T08:00:00.000Z"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## 2.4 Quản trị lấy danh sách product

`GET /api/assistant-task-products`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product:get-all`.

Query parameters:

| Tên | Kiểu | Mô tả |
| --- | --- | --- |
| `page`, `limit` | number | Phân trang. |
| `assistantId` | number | Lọc owner của product. |
| `examId` | number | Lọc exam. |
| `taskId` | number | Chỉ lấy product đã gắn task này. |
| `startAt`, `endAt` | ISO date | Khoảng `createdAt`. |
| `includeTasks` | boolean | Bao gồm mảng `tasks`. |

Ví dụ request: `GET /api/assistant-task-products?assistantId=7&taskId=31&includeTasks=true`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm trợ giảng thành công",
  "data": [
    {
      "assistantTaskProductId": 101,
      "assistantId": 7,
      "examId": 50,
      "name": "Đề kiểm tra chương 3 đã chấm",
      "quantity": 30,
      "createdAt": "2026-08-10T08:00:00.000Z",
      "updatedAt": "2026-08-10T08:00:00.000Z",
      "tasks": [
        {
          "assistantTaskId": 31,
          "courseId": 12,
          "assistantId": 7,
          "taskName": "Chấm bài kiểm tra chương 3",
          "taskType": "BAI_CHAM",
          "status": "COMPLETED",
          "deadlineAt": "2026-08-15T17:00:00.000Z",
          "completedAt": "2026-08-10T08:00:00.000Z"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## 2.5 Quản trị lấy chi tiết product

`GET /api/assistant-task-products/:assistantTaskProductId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product:get-by-id`.
- Response luôn bao gồm `tasks` (có thể rỗng).

Ví dụ request: `GET /api/assistant-task-products/101`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy sản phẩm trợ giảng thành công",
  "data": {
    "assistantTaskProductId": 101,
    "assistantId": 7,
    "examId": 50,
    "name": "Đề kiểm tra chương 3 đã chấm",
    "quantity": 30,
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z",
    "tasks": []
  }
}
```

## 2.6 Trợ giảng sửa product của mình

`PUT /api/assistant-task-products/me/:assistantTaskProductId`

- Đối tượng: **Trợ giảng**.
- Permission: `assistant-task-product:update-my`.
- Chỉ owner mới gọi được.
- Body chỉ chấp nhận `name`; không được sửa `quantity`, `assistantId`, `examId`.

Request:

```json
{
  "name": "Đề kiểm tra chương 3 đã chấm - cập nhật"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật sản phẩm của tôi thành công",
  "data": {
    "assistantTaskProductId": 101,
    "assistantId": 7,
    "examId": 50,
    "name": "Đề kiểm tra chương 3 đã chấm - cập nhật",
    "quantity": 30,
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T09:00:00.000Z"
  }
}
```

## 2.7 Quản trị sửa product

`PUT /api/assistant-task-products/:assistantTaskProductId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product:update`.
- Chỉ sửa `name` và `quantity`.
- `quantity: 0` là hợp lệ; `quantity: null` dùng để xóa số lượng đã đặt.

Request:

```json
{
  "name": "Đề kiểm tra chương 3 đã chấm",
  "quantity": 0
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật sản phẩm trợ giảng thành công",
  "data": {
    "assistantTaskProductId": 101,
    "assistantId": 7,
    "examId": 50,
    "name": "Đề kiểm tra chương 3 đã chấm",
    "quantity": 0,
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T09:00:00.000Z"
  }
}
```

## 2.8 Quản trị xóa product

`DELETE /api/assistant-task-products/:assistantTaskProductId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product:delete`.
- Chỉ xóa được product chưa gắn với bất kỳ task nào. Hãy gọi API gỡ submission trước nếu product còn đang được dùng.

Ví dụ request: `DELETE /api/assistant-task-products/101`

Response `200`:

```json
{
  "success": true,
  "message": "Xóa sản phẩm trợ giảng thành công"
}
```

Ví dụ lỗi `422` khi product còn gắn task:

```json
{
  "success": false,
  "message": "Phải gỡ sản phẩm khỏi tất cả công việc trước khi xóa",
  "statusCode": 422,
  "timestamp": "2026-08-10T09:00:00.000Z",
  "path": "/api/assistant-task-products/101"
}
```

---

# 3. API gắn/gỡ product vào task (`AssistantTaskProductSubmission`)

Một submission là một liên kết duy nhất giữa một task và một product. Một task có thể có nhiều product; một product có thể gắn vào nhiều task. Cùng một cặp task-product không thể gắn hai lần.

Khi gắn thành công, server tự đặt `submittedAt`, chuyển task sang `COMPLETED` và ghi `completedAt` nếu task chưa có thời gian hoàn thành. Khi gỡ product cuối cùng của task, task chuyển về `PENDING` và `completedAt` thành `null`.

## 3.1 Quản trị gắn product vào task

`POST /api/assistant-task-product-submissions/manage`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product-submission:manage`.
- Có thể gắn bất kỳ task và product tồn tại nào; không yêu cầu owner product trùng trợ giảng được gán task.

Request:

```json
{
  "assistantTaskId": 31,
  "assistantTaskProductId": 101
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Gắn sản phẩm vào công việc thành công",
  "data": {
    "assistantTaskProductSubmissionId": 201,
    "assistantTaskId": 31,
    "assistantTaskProductId": 101,
    "submittedAt": "2026-08-10T08:00:00.000Z",
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z"
  }
}
```

## 3.2 Quản trị gỡ product khỏi task

`DELETE /api/assistant-task-product-submissions/manage/tasks/:assistantTaskId/products/:assistantTaskProductId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product-submission:manage`.
- Gỡ đúng cặp task-product theo path.

Ví dụ request: `DELETE /api/assistant-task-product-submissions/manage/tasks/31/products/101`

Response `200`:

```json
{
  "success": true,
  "message": "Gỡ sản phẩm khỏi công việc thành công"
}
```

## 3.3 Trợ giảng gắn product của mình vào task được giao

`POST /api/assistant-task-product-submissions/me`

- Đối tượng: **Trợ giảng**.
- Permission: `assistant-task-product-submission:self-manage`.
- Product phải có `assistantId` đúng bằng trợ giảng trong token.
- Task phải có `assistantId` đúng bằng trợ giảng trong token.
- Không được gắn product của mình vào task chưa gán trợ giảng hoặc task gán cho người khác.

Request:

```json
{
  "assistantTaskId": 31,
  "assistantTaskProductId": 101
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Gắn sản phẩm của tôi vào công việc thành công",
  "data": {
    "assistantTaskProductSubmissionId": 201,
    "assistantTaskId": 31,
    "assistantTaskProductId": 101,
    "submittedAt": "2026-08-10T08:00:00.000Z",
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z"
  }
}
```

Ví dụ lỗi `403` khi ownership không hợp lệ:

```json
{
  "success": false,
  "message": "Bạn chỉ được gắn hoặc gỡ sản phẩm của mình trên công việc được giao cho mình",
  "statusCode": 403,
  "timestamp": "2026-08-10T08:00:00.000Z",
  "path": "/api/assistant-task-product-submissions/me"
}
```

## 3.4 Trợ giảng gỡ product của mình khỏi task được giao

`DELETE /api/assistant-task-product-submissions/me/tasks/:assistantTaskId/products/:assistantTaskProductId`

- Đối tượng: **Trợ giảng**.
- Permission: `assistant-task-product-submission:self-manage`.
- Áp dụng cùng ownership rule với API self attach.
- Nếu đây là product cuối cùng của task, task trở về `PENDING` và `completedAt` bị xóa.

Ví dụ request: `DELETE /api/assistant-task-product-submissions/me/tasks/31/products/101`

Response `200`:

```json
{
  "success": true,
  "message": "Gỡ sản phẩm của tôi khỏi công việc thành công"
}
```

## 3.5 Quản trị lấy danh sách submission

`GET /api/assistant-task-product-submissions`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product-submission:get-all`.

Query parameters:

| Tên | Kiểu | Mô tả |
| --- | --- | --- |
| `page`, `limit` | number | Phân trang. |
| `assistantTaskId` | number | Lọc theo task. |
| `assistantTaskProductId` | number | Lọc theo product. |
| `startAt`, `endAt` | ISO date | Khoảng `submittedAt`. |

Ví dụ request: `GET /api/assistant-task-product-submissions?assistantTaskId=31&page=1&limit=10`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách lần nộp sản phẩm thành công",
  "data": [
    {
      "assistantTaskProductSubmissionId": 201,
      "assistantTaskId": 31,
      "assistantTaskProductId": 101,
      "submittedAt": "2026-08-10T08:00:00.000Z",
      "createdAt": "2026-08-10T08:00:00.000Z",
      "updatedAt": "2026-08-10T08:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## 3.6 Quản trị lấy chi tiết submission

`GET /api/assistant-task-product-submissions/:assistantTaskProductSubmissionId`

- Đối tượng: **Người phân công / quản trị**.
- Permission: `assistant-task-product-submission:get-by-id`.

Ví dụ request: `GET /api/assistant-task-product-submissions/201`

Response `200`:

```json
{
  "success": true,
  "message": "Lấy lần nộp sản phẩm thành công",
  "data": {
    "assistantTaskProductSubmissionId": 201,
    "assistantTaskId": 31,
    "assistantTaskProductId": 101,
    "submittedAt": "2026-08-10T08:00:00.000Z",
    "createdAt": "2026-08-10T08:00:00.000Z",
    "updatedAt": "2026-08-10T08:00:00.000Z"
  }
}
```

## Tóm tắt trách nhiệm frontend

- FE **người phân công / quản trị** dùng toàn bộ API task, API product không có `/me`, và API submission có `/manage`.
- FE **trợ giảng** chỉ dùng API product `/me` và API submission `/me`; không tự tạo/sửa/xóa task.
- Không gửi `submittedAt`, `completedAt` để “nộp sản phẩm”; server là nguồn sự thật cho các mốc này.
- Không gửi `assistantId` trên self API; server lấy owner từ JWT.
- Khi muốn xóa product đang dùng, FE phải gỡ product khỏi từng task trước, rồi mới gọi delete product.
