# Thiết kế API và schema AssistantTask

## API đã chốt

| Method/path | Permission | Rule chính |
| --- | --- | --- |
| `POST /assistant-tasks` | `assistant-task:create` | Mọi field nghiệp vụ có thể bỏ qua/null; FK chỉ kiểm tra khi có ID. |
| `GET /assistant-tasks` | `assistant-task:get-all` | Lọc `startAt/endAt` theo `deadlineAt`, `productId`, `taskType`; hỗ trợ `includeProducts`. |
| `GET /assistant-tasks/:assistantTaskId` | `assistant-task:get-by-id` | Trả chi tiết và product qua submission. |
| `PUT /assistant-tasks/:assistantTaskId` | `assistant-task:update` | Task completed không đổi owner; task có submission không đổi status. |
| `DELETE /assistant-tasks/:assistantTaskId` | `assistant-task:delete` | Xóa task và submission, giữ product. |
| `POST /assistant-task-products/me` | `assistant-task-product:create-my` | Owner lấy từ token; exam phải do owner tạo; không nhận `quantity`. |
| `POST /assistant-task-products/assistants/:assistantId` | `assistant-task-product:create-for-assistant` | Exam phải do trợ giảng path tạo; quản trị được truyền `quantity`. |
| `GET /assistant-task-products/me` | `assistant-task-product:get-my` | Lọc theo `createdAt`; hỗ trợ `includeTasks`. |
| `GET /assistant-task-products` | `assistant-task-product:get-all` | Lọc owner/exam/task/thời gian; hỗ trợ `includeTasks`. |
| `GET /assistant-task-products/:assistantTaskProductId` | `assistant-task-product:get-by-id` | Chi tiết product và task qua submission. |
| `PUT /assistant-task-products/me/:assistantTaskProductId` | `assistant-task-product:update-my` | Chỉ owner; chỉ sửa `name`. |
| `PUT /assistant-task-products/:assistantTaskProductId` | `assistant-task-product:update` | Quản trị chỉ sửa `name`, `quantity`; quantity là số nguyên `>= 0` hoặc `null`. |
| `DELETE /assistant-task-products/:assistantTaskProductId` | `assistant-task-product:delete` | Từ chối nếu còn submission. |
| `POST /assistant-task-product-submissions/manage` | `assistant-task-product-submission:manage` | Quản trị gắn cặp task-product hợp lệ. |
| `DELETE /assistant-task-product-submissions/manage/tasks/:taskId/products/:productId` | `assistant-task-product-submission:manage` | Quản trị gỡ cặp. |
| `POST /assistant-task-product-submissions/me` | `assistant-task-product-submission:self-manage` | Actor phải sở hữu product và được giao task. |
| `DELETE /assistant-task-product-submissions/me/tasks/:taskId/products/:productId` | `assistant-task-product-submission:self-manage` | Cùng ownership rule với self attach. |
| `GET /assistant-task-product-submissions` | `assistant-task-product-submission:get-all` | Lọc task/product/thời gian nộp. |
| `GET /assistant-task-product-submissions/:submissionId` | `assistant-task-product-submission:get-by-id` | Lấy chi tiết lần nộp. |

## Schema và transition

- `AssistantTaskProduct.assistantId` là FK bắt buộc tới `Admin`.
- `AssistantTaskProduct.examId` vẫn nullable để giữ product khi exam bị xóa; create API luôn yêu cầu exam hợp lệ.
- `AssistantTaskProductSubmission` có unique `(assistantTaskId, assistantTaskProductId)` và giữ `submittedAt`.
- Gắn product tạo submission bằng thời gian server, chuyển task sang `COMPLETED`, giữ thời điểm hoàn thành đầu tiên.
- Gỡ submission cuối cùng chuyển task về `PENDING`, đặt `completedAt = null`; nếu còn submission thì giữ trạng thái.
- `taskName` là tên tự do. `taskType` là enum `BTVN | VIDEO | BTTL | BAI_CHAM` để lọc/phân loại.

## Validation matrix

| Thao tác | Cho phép | Từ chối |
| --- | --- | --- |
| Tạo product self | Exam do actor tạo; name tùy chọn | Exam không tồn tại/không thuộc actor; body có quantity bị validation whitelist loại bỏ/từ chối theo global pipe. |
| Tạo product quản trị | Exam do trợ giảng path tạo; quantity `0`, dương hoặc null | Exam sai owner; quantity âm. |
| Gắn self | Product owner và task assignee cùng là actor; cặp chưa tồn tại | Sai owner/assignee; task chưa gán; cặp trùng. |
| Gắn quản trị | Task và product tồn tại; cặp chưa tồn tại | Resource không tồn tại; cặp trùng. |
| Sửa task | Các field allowlist | Đổi assistant của task completed; đổi status của task có submission. |
| Sửa product self | Owner sửa name | Sửa product người khác hoặc field khác. |
| Xóa product | Không còn submission | Còn gắn ít nhất một task. |

## Migration

1. Thêm `assistant_id` nullable.
2. Backfill owner theo `Exam.createdBy`, fallback `AssistantTask.assistantId`.
3. Tạo join table và backfill liên kết một-nhiều cũ.
4. Đổi owner thành required, xóa FK/cột `assistant_task_id`.
5. Tạo index/FK, generate Prisma Client, build và kiểm tra migration status.
