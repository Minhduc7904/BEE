---
name: assistant-task-management-business-rules
description: Thiết kế luồng task và product của trợ giảng, gồm ownership, nộp product vào task, trạng thái hoàn thành và API self-service/quản trị.
---

# Quản lý task và product trợ giảng

## Phạm vi và thuật ngữ

- `AssistantTask` là công việc; các field nullable được phép để `null` khi tạo task nháp.
- `AssistantTaskProduct` là sản phẩm do một trợ giảng sở hữu. Product phải liên kết với một `Exam` được tạo bởi chính trợ giảng đó khi được tạo qua các API trong skill này.
- `AssistantTaskProductSubmission` là bản ghi liên kết giữa một task và một product. Đây là nguồn sự thật cho quan hệ many-to-many và thời điểm nộp `submittedAt`.
- `taskName` là chuỗi mở để người dùng đặt tên tự do; không rẽ nhánh nghiệp vụ theo tên task.
- `taskType` là enum phân loại ổn định gồm `BTVN`, `VIDEO`, `BTTL`, `BAI_CHAM`; chỉ dùng để lọc/báo cáo, không thay thế `taskName`.

Đọc toàn bộ [template.md](template.md) và [reference-files.md](reference-files.md) trước khi code. Khi triển khai, đọc thêm `database-schema-changes`, `create-application-use-case`, `create-dto`, `create-prisma-repository`, `create-prisma-mapper` và `create-presentation-controller` theo lớp bị ảnh hưởng.

## Mô hình ownership và quan hệ

- `AssistantTaskProduct.assistantId` là trợ giảng sở hữu product; API “của tôi” lấy ID này từ `@CurrentUser('adminId')`, không nhận từ body/query.
- API cho trợ giảng cụ thể nhận `assistantId` từ path, chỉ dành cho actor có permission quản trị. Nó xác minh `Exam.createdBy === assistantId` trước khi tạo product.
- Bản ghi `AssistantTaskProductSubmission` là duy nhất theo cặp `(assistantTaskId, assistantTaskProductId)`. Một task có nhiều product, một product có thể được nộp cho nhiều task; cùng một product không được nộp hai lần vào cùng task.
- API nộp product tự phục vụ chỉ cho phép khi product và task đều thuộc `adminId` hiện tại: `product.assistantId === actorAdminId` và `task.assistantId === actorAdminId`. Task chưa được gán trợ giảng không thể được nộp bằng API này.

## Luồng BE

### Tạo product dùng chung bởi API và luồng nội bộ

1. `CreateAssistantTaskProductService` nhận command đáng tin cậy gồm `assistantId`, `examId`, `name` và trường số lượng/chất lượng được phép theo policy của caller.
2. Service tìm `Exam`; từ chối khi exam không tồn tại hoặc `exam.createdBy !== assistantId`.
3. Service tạo product với owner `assistantId`. Luồng đăng đề thi/tạo video gọi trực tiếp service này bằng dữ liệu đã được use case nguồn kiểm tra; controller không gọi repository trực tiếp.
4. `CreateMyAssistantTaskProductUseCase` lấy `assistantId` từ actor và không truyền `quantity` vào service. `CreateAssistantTaskProductUseCase` chỉ mở `quantity` cho actor có permission quản trị; giá trị hợp lệ gồm số nguyên từ `0` trở lên hoặc `null`.
5. `examId` và `assistantId` phải được ghi cùng product trong một transaction. Nếu use case quản trị yêu cầu audit, audit thành công được ghi trong cùng Unit of Work.

### Nộp/gắn product vào task

1. Use case kiểm tra task, product, ownership của actor và sự trùng cặp submission.
2. Tạo `AssistantTaskProductSubmission` với `submittedAt = thời điểm server`, không nhận thời điểm này từ client.
3. Trong cùng transaction, chuyển task sang `COMPLETED`. Nếu task chưa hoàn thành, đặt `completedAt` bằng chính `submittedAt`; nếu đã hoàn thành, giữ nguyên `completedAt` để bảo toàn thời điểm hoàn thành đầu tiên.
4. Sau khi task đã có submission, API cập nhật task không được thay đổi `status`. Quy tắc này không cản use case nộp product vì đó là transition chuyên biệt, atomic.

### Gỡ product khỏi task

1. Có hai permission độc lập: `assistant-task-product-submission:manage` cho quản trị và `assistant-task-product-submission:self-manage` cho trợ giảng tự phục vụ.
2. API quản trị được gắn/gỡ mọi cặp task-product hợp lệ. API tự phục vụ chỉ được gắn/gỡ khi `product.assistantId` và `task.assistantId` đều bằng `adminId` hiện tại.
3. Gỡ submission trong transaction. Nếu task vẫn còn submission khác thì giữ nguyên trạng thái; nếu vừa gỡ submission cuối cùng thì chuyển task về `PENDING` và đặt `completedAt = null`.

### Tạo, cập nhật và xóa task

- Tạo task: DTO chỉ nhận các field nullable như `courseId`, `assistantId`, `taskName`, `deadlineAt`, `completedAt`, `note`; field không nullable dùng default schema (`PENDING`, `false`). Use case kiểm tra FK chỉ khi ID được truyền. Không được gửi `status: null`.
- Cập nhật task: nếu task đang `COMPLETED`, không được thay đổi `assistantId`; nếu task có ít nhất một submission, không được thay đổi `status`. Các field còn lại được phép cập nhật sau khi kiểm tra FK/validation.
- Xóa task: xóa task và các submission phụ thuộc trong cùng transaction; product vẫn tồn tại. Đây là hard delete theo yêu cầu hiện tại, phải có audit nếu endpoint thuộc quản trị.

### Cập nhật và xóa product

- API “của tôi” chỉ sửa `name` của product do actor sở hữu. API quản trị cho product cụ thể có thể sửa `name` và `quantity`; `quantity` có thể bằng `0` hoặc `null`.
- Không API nào được đổi `assistantId` hoặc `examId` sau khi tạo; điều này giữ đúng ownership đã kiểm tra với `Exam.createdBy`.
- Từ chối xóa product còn submission. Client phải gọi API gỡ riêng cho từng task trước; không xóa ngầm submission.

## Phân bổ API theo controller

- `AssistantTaskController`: tạo, lấy danh sách/chi tiết, sửa và xóa task. Danh sách lọc theo `startAt`, `endAt`, `productId`, `taskType` và có `includeProducts`. Khi `includeProducts=true`, mỗi product trả `examName`, `solutionYoutubeUrl`, `examFileName` và `examSolutionFileName`; URL lấy trực tiếp từ `Exam.solutionYoutubeUrl`, hai tên file chỉ lấy từ `MediaUsage` có `entityType=EXAM`, lần lượt `fieldName=EXAM_FILE` và `SOLUTION_FILE` (tương thích dữ liệu cũ `EXAM_SOLUTION_FILE`), không có thì trả `null`.
- `AssistantTaskProductController`: API quản trị và `/me` để tạo/lấy/sửa product; chỉ API quản trị nhận `quantity`. Danh sách lọc theo thời gian tạo và có `includeTasks`.
- `AssistantTaskProductSubmissionController`: lấy danh sách/chi tiết submission và các API gắn/gỡ quản trị hoặc tự phục vụ. `submittedAt` luôn do server tạo.

## Luồng FE client và FE admin

- FE trợ giảng dùng API `/me`; không gửi `assistantId`, `submittedAt`, hoặc status task. FE hiển thị trạng thái/trạng thái hoàn thành từ response BE.
- FE quản trị chọn trợ giảng mục tiêu trong URL và chỉ hiển thị trường số lượng/chất lượng cho endpoint được phép. FE không tự kết luận một exam thuộc trợ giảng nào.
- Khi nộp product, FE gửi `assistantTaskId` và `assistantTaskProductId`; BE xác định thời gian nộp và cập nhật task. Nếu conflict vì đã nộp product này, FE hiển thị lỗi và không tự retry.

## Guardrail triển khai

- Dùng `AssistantTaskProductSubmission`, không lưu `assistantTaskId` trực tiếp trong product nữa.
- Status task chỉ thay đổi ở use case task hoặc service submission dùng chung cho gắn/gỡ; repository/controller/DTO không chứa transition.
- `submittedAt` và `completedAt` dùng thời điểm server, không tin dữ liệu client.
- List product chỉ include task qua `submissions -> task` khi query yêu cầu; list task chỉ include product qua `submissions -> product` khi query yêu cầu.
- DTO list phải giới hạn sort field; `startAt <= endAt` là validation liên trường ở use case.
- Trước khi sửa bất kỳ symbol có sẵn nào, chạy GitNexus impact analysis. Khi đổi schema, dùng expand → backfill → switch → contract, review SQL, generate Prisma Client, build và kiểm tra migration status.
