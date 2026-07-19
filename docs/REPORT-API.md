# Report API

Base URL: `/api`

Tất cả API trong tài liệu này dùng JSON. Các API cần đăng nhập phải gửi:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Phân quyền

| Nhóm API | Yêu cầu truy cập |
| --- | --- |
| Tạo báo cáo, xem danh sách/cụ thể của chính mình | Chỉ cần access token hợp lệ; không yêu cầu permission |
| Danh sách cho quản trị | `report:get-all` |
| Chi tiết cho quản trị | `report:get-by-id` |
| Cập nhật cho quản trị | `report:update` |
| Xóa cho quản trị | `report:delete` |

`reporterId` không nhận từ request. Với API tạo của học sinh, backend lấy `userId` từ access token. Ở tầng dữ liệu, `reporter_id` là nullable để vẫn lưu được báo cáo không gắn người gửi từ các luồng nội bộ sau này.

## Giá trị enum

### `targetType`

| Giá trị | Trường bắt buộc duy nhất |
| --- | --- |
| `ADMIN` | `reportedAdminId` |
| `QUESTION` | `questionId` |
| `EXAM` | `examId` |
| `CLASS` | `classId` |
| `CLASS_SESSION` | `sessionId` |
| `WEBSITE` | `pageUrl` |

Không được gửi đồng thời hai target ID, hoặc vừa target ID vừa `pageUrl`.

### `reason`

`INCORRECT_TEACHING`, `INCORRECT_CONTENT`, `INAPPROPRIATE_BEHAVIOR`, `CLASS_ISSUE`, `TECHNICAL_ISSUE`, `WEBSITE_ISSUE`, `OTHER`.

### `status`

`PENDING`, `IN_REVIEW`, `RESOLVED`, `REJECTED`.

## Cấu trúc response

### Thành công với một bản ghi

```json
{
  "success": true,
  "message": "Gửi báo cáo thành công",
  "data": {
    "reportId": 12,
    "reporterId": 24,
    "targetType": "QUESTION",
    "reason": "INCORRECT_CONTENT",
    "description": "Đáp án ở câu 3 không khớp lời giải.",
    "status": "PENDING",
    "reportedAdminId": null,
    "questionId": 81,
    "examId": null,
    "classId": null,
    "sessionId": null,
    "pageUrl": null,
    "handledById": null,
    "handledAt": null,
    "resolutionNote": null,
    "createdAt": "2026-07-19T14:00:00.000Z",
    "updatedAt": "2026-07-19T14:00:00.000Z",
    "isClosed": false,
    "reporter": {
      "userId": 24,
      "username": "student01",
      "fullName": "Nguyễn An"
    },
    "reportedAdmin": null,
    "handledBy": null,
    "question": { "questionId": 81, "slug": "toan-10-cau-81" },
    "exam": null,
    "courseClass": null,
    "classSession": null
  }
}
```

### Thành công với danh sách

```json
{
  "success": true,
  "message": "Lấy danh sách báo cáo thành công",
  "data": [{ "reportId": 12, "targetType": "QUESTION", "status": "PENDING" }],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

`data` của danh sách dùng cùng cấu trúc đầy đủ như response một bản ghi. Các trường `previousPage` và `nextPage` chỉ xuất hiện khi có giá trị.

### Lỗi chung

```json
{
  "success": false,
  "message": "Báo cáo QUESTION chỉ phải có questionId",
  "statusCode": 400,
  "timestamp": "2026-07-19T14:01:00.000Z",
  "path": "/api/reports"
}
```

## 1. Học sinh tạo báo cáo

`POST /api/reports` — chỉ cần access token hợp lệ, HTTP `201`.

Backend lấy người gửi từ token, vì vậy request không có `reporterId`.

Ví dụ báo cáo câu hỏi:

```http
POST /api/reports
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "targetType": "QUESTION",
  "questionId": 81,
  "reason": "INCORRECT_CONTENT",
  "description": "Đáp án A không khớp với phép tính trong lời giải."
}
```

Ví dụ báo cáo buổi học:

```json
{
  "targetType": "CLASS_SESSION",
  "sessionId": 17,
  "reason": "INCORRECT_TEACHING",
  "description": "Nội dung giảng về định lý bị sai."
}
```

Ví dụ báo cáo trang web:

```json
{
  "targetType": "WEBSITE",
  "pageUrl": "https://bee.vn/exams/toan-10",
  "reason": "WEBSITE_ISSUE",
  "description": "Nút nộp bài không phản hồi trên Chrome 126."
}
```

Response `201`: dùng cấu trúc thành công một bản ghi ở trên; `status` luôn khởi tạo là `PENDING`.

Lỗi cụ thể:

| HTTP | Khi nào | Ví dụ `message` |
| --- | --- | --- |
| 400 | Thiếu/sai enum/kiểu field | `Loại đối tượng báo cáo không hợp lệ` |
| 400 | `pageUrl` không có giao thức hoặc không phải URL | `pageUrl phải là URL hợp lệ, gồm http:// hoặc https://` |
| 400 | Target không đúng quy tắc một target | `Báo cáo QUESTION chỉ phải có questionId` |
| 400 | Có field lạ trong body | `property reporterId should not exist` |
| 401 | Không có, hết hạn hoặc sai token | `Access token is required` |
| 404 | ID đối tượng đúng kiểu nhưng không tồn tại | `Đối tượng được báo cáo không tồn tại` |

## 2. Học sinh xem danh sách báo cáo của bản thân

`GET /api/reports/me` — chỉ cần access token hợp lệ, HTTP `200`.

Query chung:

| Query | Kiểu | Mặc định | Mô tả |
| --- | --- | --- | --- |
| `page` | integer 1–1000 | `1` | Trang hiện tại |
| `limit` | integer 1–1000 | `10` | Số dòng/trang |
| `sortBy` | string | `createdAt` | `reportId`, `createdAt`, `updatedAt`, `handledAt`, `status`, `targetType`, `reason` |
| `sortOrder` | `asc`/`desc` | `desc` | Hướng sắp xếp |
| `search` | string | — | Tìm trong mô tả, ghi chú xử lý, URL trang web |
| `fromDate`, `toDate` | ISO date | — | Lọc theo `createdAt` |
| `targetType`, `reason`, `status` | enum | — | Lọc theo loại/lý do/trạng thái |
| `reportedAdminId`, `questionId`, `examId`, `classId`, `sessionId`, `handledById` | integer | — | Lọc theo đối tượng hoặc admin xử lý |

`reporterId` không được nhận ở endpoint này: global validation sẽ trả `400` nếu gửi field đó. Backend luôn lọc bằng người dùng trong token.

Ví dụ:

```http
GET /api/reports/me?page=1&limit=10&status=PENDING&targetType=WEBSITE&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <student_token>
```

Response `200`: cấu trúc thành công danh sách ở trên.

Lỗi: `400` khi query sai kiểu/enum hoặc gửi field không được phép; `401` khi token thiếu hoặc không hợp lệ.

## 3. Học sinh xem chi tiết báo cáo của bản thân

`GET /api/reports/me/:id` — chỉ cần access token hợp lệ, HTTP `200`.

Ví dụ:

```http
GET /api/reports/me/12
Authorization: Bearer <student_token>
```

Response `200`: cấu trúc thành công một bản ghi.

Lỗi cụ thể:

| HTTP | `message` |
| --- | --- |
| 400 | `Validation failed (numeric string is expected)` nếu `id` không phải số nguyên |
| 401 | `Access token is required` hoặc lỗi token tương ứng |
| 403 | `Bạn không có quyền xem báo cáo này` nếu ID thuộc người gửi khác |
| 404 | `Không tìm thấy báo cáo có ID 12` |

## 4. Admin xem danh sách báo cáo

`GET /api/reports/admin` — cần permission `report:get-all`; HTTP `200`.

Endpoint có toàn bộ query của API “báo cáo của bản thân”, cộng thêm:

| Query | Kiểu | Mô tả |
| --- | --- | --- |
| `reporterId` | integer | Lọc theo người gửi. Có thể kết hợp với các filter khác. |

Ví dụ:

```http
GET /api/reports/admin?page=2&limit=20&status=IN_REVIEW&reason=INCORRECT_TEACHING&reportedAdminId=4&fromDate=2026-07-01&toDate=2026-07-31&sortBy=handledAt&sortOrder=asc
Authorization: Bearer <admin_token>
```

Response `200`: cấu trúc thành công danh sách.

Lỗi: `400` nếu query không hợp lệ; `401` nếu token không hợp lệ; `403` nếu thiếu `report:get-all`.

## 5. Admin xem chi tiết

`GET /api/reports/admin/:id` — cần permission `report:get-by-id`; HTTP `200`.

```http
GET /api/reports/admin/12
Authorization: Bearer <admin_token>
```

Response `200`: cấu trúc thành công một bản ghi. Với target tương ứng, `reportedAdmin`, `question`, `exam`, `courseClass` hoặc `classSession` được trả về; báo cáo website có `pageUrl`.

Lỗi: `400` nếu `id` sai; `401` token thiếu/sai; `403` thiếu `report:get-by-id`; `404` khi không có report ID.

## 6. Admin cập nhật/xử lý báo cáo

`PATCH /api/reports/admin/:id` — cần permission `report:update`; HTTP `200`.

Chỉ cập nhật lý do, mô tả, trạng thái và ghi chú xử lý. Admin cập nhật được ghi tự động vào `handledById` và `handledAt`; API không cho đổi người gửi hay đối tượng báo cáo, để giữ nguyên lịch sử ban đầu.

```http
PATCH /api/reports/admin/12
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "RESOLVED",
  "resolutionNote": "Đã sửa đáp án và kiểm tra lại lời giải.",
  "description": "Học sinh báo đáp án câu 3 không khớp lời giải."
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật báo cáo thành công",
  "data": {
    "reportId": 12,
    "status": "RESOLVED",
    "handledById": 4,
    "handledAt": "2026-07-19T14:10:00.000Z",
    "resolutionNote": "Đã sửa đáp án và kiểm tra lại lời giải.",
    "isClosed": true
  }
}
```

Lỗi cụ thể:

| HTTP | Khi nào | Ví dụ `message` |
| --- | --- | --- |
| 400 | Sai `reason`, `status`, kiểu chuỗi, quá 5000 ký tự, hoặc field lạ | `Trạng thái báo cáo không hợp lệ` |
| 401 | Token thiếu/sai | `Access token is required` |
| 403 | Không có permission | `Access denied. Required permissions: report:update` |
| 404 | Báo cáo không tồn tại | `Không tìm thấy báo cáo có ID 12` |

## 7. Admin xóa báo cáo

`DELETE /api/reports/admin/:id` — cần permission `report:delete`; HTTP `200`.

```http
DELETE /api/reports/admin/12
Authorization: Bearer <admin_token>
```

Response `200`:

```json
{
  "success": true,
  "message": "Xóa báo cáo thành công",
  "data": null
}
```

Lỗi: `400` khi `id` sai; `401` khi token thiếu/sai; `403` khi thiếu `report:delete`; `404` khi report không tồn tại.
