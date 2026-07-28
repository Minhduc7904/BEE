# Assistant task management API

Module có ba resource: task, product và submission (bảng join many-to-many).

## Task

- `POST /assistant-tasks`: tạo task; các field `courseId`, `assistantId`, `taskName`, `taskType`, `deadlineAt`, `completedAt`, `note` có thể bỏ qua hoặc truyền `null` khi phù hợp.
- `GET /assistant-tasks`: pagination `page/limit`; lọc `courseId`, `assistantId`, `productId`, `taskName`, `taskType`, `status`, `isBaseTask`, `startAt`, `endAt`; `includeProducts=true`.
- `GET /assistant-tasks/:assistantTaskId`: chi tiết task.
- `PUT /assistant-tasks/:assistantTaskId`: task đã `COMPLETED` không đổi `assistantId`; task có product không đổi `status`.
- `DELETE /assistant-tasks/:assistantTaskId`: xóa task và các submission, không xóa product.

## Product

- `POST /assistant-task-products/me`: body `{ examId, name? }`; owner lấy từ token; không nhận `quantity`.
- `POST /assistant-task-products/assistants/:assistantId`: body `{ examId, name?, quantity? }`; `quantity` là số nguyên `>= 0` hoặc `null`.
- `GET /assistant-task-products/me`: danh sách của actor; lọc `startAt/endAt`, hỗ trợ `includeTasks`.
- `GET /assistant-task-products`: danh sách quản trị; lọc `assistantId`, `examId`, `taskId`, `startAt/endAt`, hỗ trợ `includeTasks`.
- `GET /assistant-task-products/:assistantTaskProductId`: chi tiết.
- `PUT /assistant-task-products/me/:assistantTaskProductId`: self chỉ sửa `{ name }`.
- `PUT /assistant-task-products/:assistantTaskProductId`: quản trị sửa `{ name?, quantity? }`.
- `DELETE /assistant-task-products/:assistantTaskProductId`: chỉ xóa khi product không còn gắn task.

Mọi API tạo product đều kiểm tra `Exam.createdBy === assistantId`.

## Submission: gắn và gỡ product

- Quản trị gắn: `POST /assistant-task-product-submissions/manage`, body `{ assistantTaskId, assistantTaskProductId }`, permission `assistant-task-product-submission:manage`.
- Quản trị gỡ: `DELETE /assistant-task-product-submissions/manage/tasks/:assistantTaskId/products/:assistantTaskProductId`, cùng permission quản trị.
- Trợ giảng gắn: `POST /assistant-task-product-submissions/me`, cùng body, permission `assistant-task-product-submission:self-manage`.
- Trợ giảng gỡ: `DELETE /assistant-task-product-submissions/me/tasks/:assistantTaskId/products/:assistantTaskProductId`, cùng permission self.
- `GET /assistant-task-product-submissions`: lọc theo task, product và `startAt/endAt`.
- `GET /assistant-task-product-submissions/:assistantTaskProductSubmissionId`: chi tiết.

Self attach/detach yêu cầu actor vừa sở hữu product vừa là `assistantId` của task. Attach tự ghi `submittedAt`, chuyển task sang `COMPLETED` và ghi `completedAt`. Gỡ product cuối cùng chuyển task về `PENDING` và xóa `completedAt`.
