# Assistant Shift Assignment API

Base URL: `/api`. Mọi API yêu cầu `Authorization: Bearer <token>` và permission ghi ở từng endpoint.

## Quy ước response

Mọi response thành công dùng cùng envelope:

```json
{ "success": true, "message": "...", "data": {} }
```

Các trường thời gian là ISO 8601. Ví dụ dưới đây dùng `+07:00`; client nên gửi timezone rõ ràng.

## Tài liệu liên quan

- [Assistant Shift](./assistant-shifts.md)
- [Assistant Shift Series](./assistant-shift-series.md)
- [Assistant Shift Assignment](./assistant-shift-assignment.md)

## Tự đăng ký và chấm công

### POST `/assistant-shifts/:id/register`

- Permission: `assistant-shift:register`.
- Chỉ admin có role trợ giảng cấu hình (`ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID`, hiện là `16`) mới được tự đăng ký.
- Request: không body. `adminId` lấy từ JWT, client không gửi `adminId`.
- Rule: shift không được là ca cơ sở và shift/series phải chưa khóa; **`now` phải trước `endAt`**; không được có assignment trùng `(shiftId, adminId)`. Cửa sổ tự đăng ký: cả hai mốc `null` là không giới hạn, chỉ `openAt` là đăng ký từ mốc đó, chỉ `closeAt` là đăng ký trước mốc đó, có cả hai mốc thì `openAt <= now < closeAt`. Assignment tạo mới luôn có `attendanceStatus = PENDING`.

Request:

```http
POST /api/assistant-shifts/101/register
```

Response `201`:

```json
{
  "success": true,
  "message": "Đăng ký ca thành công",
  "data": {
    "assistantShiftId": 101,
    "adminId": 25,
    "attendanceStatus": "PENDING",
    "absenceReason": null,
    "managerNote": null
  }
}
```

Lỗi riêng: `404` khi shift/series khóa hoặc không tồn tại; `400` ngoài thời gian tự đăng ký; `409` khi đã đăng ký.

### DELETE `/assistant-shifts/:id/register`

- Permission: `assistant-shift:cancel-registration`.
- Request: không có body. `adminId` luôn lấy từ JWT, nên chỉ có thể hủy assignment của chính trợ giảng đang đăng nhập.
- Rule: giống API đăng ký: ca cơ sở và shift/series khóa đều không thể hủy; áp dụng cùng cửa sổ tự đăng ký; **`now` phải trước `endAt`**. Assignment `(shiftId, adminId)` phải tồn tại và có `attendanceStatus = PENDING`; assignment `PRESENT` hoặc `ABSENT` không thể tự hủy.

Request:

```http
DELETE /api/assistant-shifts/101/register
Authorization: Bearer <token>
```

Response `200`:

```json
{ "success": true, "message": "Hủy đăng ký ca thành công", "data": { "cancelled": true } }
```

Lỗi: `404` khi ca/series khóa, không tồn tại hoặc trợ giảng chưa đăng ký; `400` khi ngoài thời gian tự đăng ký, ca đã kết thúc hoặc assignment không còn `PENDING`.

## Đổi ca và nhường ca giữa trợ giảng

Hai API gửi đề nghị yêu cầu JWT và permission riêng. Mỗi lần gửi tạo một bản ghi `ActionApprovalRequest` độc lập; bảng này không là con của assignment để tái sử dụng được cho các đề nghị cần phê duyệt khác sau này.

Ca cơ sở, ca lock hoặc ca thuộc series lock không thể được đổi/nhường hay phản hồi đề nghị đổi/nhường bởi trợ giảng.

Bốn URL trong email là **public GET**, không dùng JWT. Query `token` là token ngẫu nhiên 64 ký tự của **đề nghị**, database chỉ lưu SHA-256 của token. Assignment token vẫn chỉ dùng cho điểm danh, không bị lộ hoặc thay mới bởi luồng đổi/nhường ca.

Khi bấm link, hệ thống claim đề nghị `PENDING` sang `PROCESSING` trong cùng transaction, kiểm tra lại toàn bộ assignment/ca/owner thực tế rồi mới đổi dữ liệu và chốt `ACCEPTED` hoặc `DECLINED`. Vì vậy bấm hai lần, click hai email trùng nhau, hoặc click lại email cũ chỉ nhận trang trạng thái; không thể đổi/nhường lặp.

Chống spam khi tạo đề nghị: chỉ một đề nghị giống hệt còn hoạt động; sau khi từ chối cùng đề nghị phải chờ một giờ; tối đa 5 đề nghị/15 phút và 15 đề nghị/24 giờ cho người gửi, tối đa 3 đề nghị/giờ cho cùng người nhận. Đề nghị hết hạn tại mốc sớm hơn giữa `endAt` của ca liên quan và 24 giờ sau lúc tạo.

### POST `/assistant-shift-assignment-actions/my/swap-requests`

- Permission: `assistant-shift:request-swap`.
- Mục đích: gửi email đề nghị đổi ca đến trợ giảng đang sở hữu assignment đích.
- Rule: người gửi phải sở hữu `myAssistantShiftId`; hai assignment phải khác nhau, cùng là `PENDING`, cả hai ca chưa kết thúc; hai người phải có role trợ giảng hợp lệ; người nhận phải đang hoạt động và có email.

Request:

```json
{
  "myAssistantShiftId": 101,
  "targetAssistantShiftId": 102,
  "targetAdminId": 26
}
```

Response `201`:

```json
{ "success": true, "message": "Đã gửi email đề nghị đổi ca", "data": { "sent": true, "actionApprovalRequestId": 91 } }
```

Email đến trợ giảng `26` có hai link sau:

```http
GET /api/assistant-shift-assignment-actions/swap/accept?token=<action-approval-request-token>
GET /api/assistant-shift-assignment-actions/swap/decline?token=<action-approval-request-token>
```

- **Xác nhận**: transaction đổi `assistantShiftId` của hai assignment; giữ nguyên trạng thái `PENDING` và các metadata của từng assignment. Assignment nhận ca được tạo token điểm danh mới theo luồng cập nhật repository hiện có.
- **Từ chối**: không đổi ca; đề nghị thành `DECLINED`, người gửi nhận email thông báo bị từ chối; cùng đề nghị bị chặn gửi lại trong 1 giờ.
- Cả hai URL trả trang `text/html`, không trả JSON. Nếu token sai, ca đã kết thúc, assignment không còn `PENDING`, hoặc đề nghị đã xử lý thì hiển thị trang trạng thái tương ứng.

### POST `/assistant-shift-assignment-actions/my/transfer-requests`

- Permission: `assistant-shift:request-transfer`.
- Mục đích: gửi email đề nghị nhường một assignment của chính mình cho một trợ giảng khác.
- Rule: người gửi phải sở hữu assignment; assignment phải `PENDING`; ca chưa kết thúc; người nhận khác người gửi, có role trợ giảng hợp lệ, đang hoạt động, có email, và chưa có assignment ở ca đó.

Request:

```json
{
  "assistantShiftId": 101,
  "targetAdminId": 26
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Đã gửi email đề nghị nhường ca",
  "data": { "sent": true, "actionApprovalRequestId": 92 }
}
```

Email đến trợ giảng `26` có hai link sau:

```http
GET /api/assistant-shift-assignment-actions/transfer/accept?token=<action-approval-request-token>
GET /api/assistant-shift-assignment-actions/transfer/decline?token=<action-approval-request-token>
```

- **Xác nhận**: transaction đổi `adminId` của assignment sang người nhận trong payload đề nghị, giữ `attendanceStatus = PENDING`, tạo token điểm danh mới và đặt lại trạng thái reminder để người nhận nhận được email điểm danh hợp lệ.
- **Từ chối**: assignment không đổi chủ; đề nghị thành `DECLINED` và người gửi nhận email thông báo bị từ chối.
- Hai URL là public GET, trả trang `text/html`. Chúng vẫn kiểm tra token đề nghị, owner thực tế, assignment `PENDING` và `now < endAt` trước khi thay đổi dữ liệu.

### GET `/api/assistant-shifts/:id/check-in`

- Public endpoint: không dùng JWT và không yêu cầu permission.
- Query bắt buộc: `token` là token ngẫu nhiên của đúng assignment. API bắt buộc khớp cả `:id` (ID ca) và `token`; token không được trả trong các API danh sách/lịch.
- Rule: chỉ điểm danh trong khoảng từ `startAt - 45 phút` đến **trước** `endAt`, ca không phải ca cơ sở, shift/series không khóa và assignment phải còn `PENDING`. Điểm danh thành công chuyển trạng thái thành `PRESENT`.

Request:

```http
GET /api/assistant-shifts/101/check-in?token=<64-character-token>
```

Response luôn là trang `text/html` có icon ở giữa, tiêu đề và thông báo trạng thái; không trả JSON.

- Bấm lại link sau khi assignment đã `PRESENT` trả trang HTML thành công với thông báo `Bạn đã điểm danh thành công rồi.`
- Trước mốc `startAt - 45 phút` trả `Chưa đến thời gian điểm danh`; từ `endAt` trở đi trả `Đã hết hạn điểm danh`.
- Token sai hoặc assignment có trạng thái khác `PENDING`/`PRESENT` trả trang HTML thất bại. Không gửi `Authorization` header.

## Email nhắc lịch và token điểm danh

- Khi repository tạo assignment (tự đăng ký, quản lý phân công hoặc sao chép), hệ thống tự sinh `token` ngẫu nhiên 64 ký tự và đặt `shouldSendReminderEmail = true`.
- Ca cơ sở không tham gia reminder, check-in hoặc auto-vắng; ca lock vẫn tham gia automation như bình thường.
- Assignment cũ giữ `token = null` và `shouldSendReminderEmail = false`, nên không được job gửi email xử lý.
- Background job `ASSISTANT_SHIFT_REMINDER` chạy mỗi 5 phút (`0 */5 * * * *`, `Asia/Ho_Chi_Minh`), dùng database lease lock và tạo một `BackgroundJobRun` `RUNNING → SUCCEEDED/FAILED` cho mỗi lần chạy thực tế.
- Với assignment `PENDING`, email điểm danh được gửi đúng một lần khi thời điểm hiện tại nằm trong `[startAt - 45 phút, endAt]`. Subject có dạng `16:00 - 18:00 Lớp đại 12A - Bạn có lịch đi trợ giảng`.
- Nếu đã quá `endAt` mà assignment vẫn `PENDING`, job luôn chuyển trạng thái thành `ABSENT`, lý do `Không điểm danh trước khi ca kết thúc`. Nếu trợ giảng có email thì gửi đúng một email thông báo vắng; không có email vẫn được chuyển `ABSENT` nhưng không gọi email provider. Email provider lỗi sẽ được đánh dấu để job lần sau thử lại.
- Hai mốc `checkInReminderSentAt` và `absenceEmailSentAt` đảm bảo từng loại email không bị gửi trùng. Với trợ giảng không có email, `absenceEmailSentAt` vẫn được đánh dấu sau khi chuyển `ABSENT` để không xử lý lặp; `shouldSendReminderEmail` chỉ là cờ cho phép assignment mới tham gia luồng email.
- Khi email provider lỗi, `BackgroundJobRun.resultSummary` lưu `emailFailures`: loại email, `assistantShiftId`, `adminId`, email đã che bớt, thời điểm, `errorMessage` và `errorCode`/`httpStatus` nếu provider trả về. Scheduler ghi từng bản ghi này vào log; không lưu token hay API key.
- Template ở `src/infrastructure/templates/assistant-shift-reminder.template.ts`. Nút **Điểm danh** gọi chính xác `GET /api/assistant-shifts/:assistantShiftId/check-in?token=:token`; base URL lấy từ `API_BASE_URL`.
- Cấu hình bắt buộc: `RESEND_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM_ADDRESS`, `MAIL_REPLY_TO`, `MAIL_ENABLED=true`, và `API_BASE_URL` phải là URL public của backend có hậu tố `/api`.

## Phân công do quản lý thực hiện

Ba API này không áp dụng rule khóa của shift/series: quản lý có thể phân công, sửa hoặc xóa trong mọi trạng thái.

### POST `/assistant-shifts/:shiftId/assignments`

- Permission: `assistant-shift:assign`.
- Admin được phân công phải có role trợ giảng cấu hình (`ASSISTANT_SHIFT_CONFIG.ELIGIBLE_ASSISTANT_ROLE_ID`, hiện là `16`).
- Rule: shift và admin phải tồn tại; cặp `(shiftId, adminId)` là duy nhất. `attendanceStatus` nhận `PENDING`, `PRESENT`, `ABSENT`.

Request:

```json
{ "adminId": 25, "attendanceStatus": "PENDING", "absenceReason": null, "managerNote": "Hỗ trợ giáo viên" }
```

Response `201`:

```json
{
  "success": true,
  "message": "Phân công trợ giảng thành công",
  "data": {
    "assistantShiftId": 101,
    "adminId": 25,
    "attendanceStatus": "PENDING",
    "absenceReason": null,
    "managerNote": "Hỗ trợ giáo viên"
  }
}
```

### PUT `/assistant-shifts/:shiftId/assignments/:adminId`

- Permission: `assistant-shift:update-assignment`.
- Rule: mọi trường body tùy chọn; assignment phải tồn tại.

Request `PUT /assistant-shifts/101/assignments/25`:

```json
{ "attendanceStatus": "ABSENT", "absenceReason": "Nghỉ ốm", "managerNote": "Đã báo trước" }
```

Response `200`:

```json
{
  "success": true,
  "message": "Cập nhật phân công thành công",
  "data": {
    "assistantShiftId": 101,
    "adminId": 25,
    "attendanceStatus": "ABSENT",
    "absenceReason": "Nghỉ ốm",
    "managerNote": "Đã báo trước"
  }
}
```

### DELETE `/assistant-shifts/:shiftId/assignments/:adminId`

- Permission: `assistant-shift:delete-assignment`.
- Rule: assignment phải tồn tại.

Response `200`:

```json
{ "success": true, "message": "Xóa phân công thành công", "data": { "deleted": true } }
```


## API lịch và thống kê của trợ giảng

Hai API dưới đây dành cho trợ giảng đang đăng nhập. `adminId` luôn lấy từ Bearer JWT, không nhận từ path, query hay body. Cả hai vẫn giữ dữ liệu của ca/series khóa, nhưng luôn loại ca cơ sở.

### GET `/api/assistant-shifts/my`

- Permission: `assistant-shift:get-my-schedule`.
- Status thành công: `200 OK`.
- Bắt buộc truyền `startAt` và `endAt`; không truyền `seriesId`.
- Chỉ trả các ca mà admin hiện tại có `AssistantShiftAssignment`. Mỗi ca chỉ include assignment của admin hiện tại, đồng thời include `series` và `courseClass` (nếu ca gắn lớp).
- Không áp dụng rule lọc khóa; API chỉ để xem lịch, không cho đăng ký/chỉnh sửa. Không trả ca cơ sở.

Request:

```http
GET /api/assistant-shifts/my?startAt=2026-07-16&endAt=2026-07-18&attendanceStatus=PRESENT
Authorization: Bearer <token>
```

Khoảng ngày dùng cùng quy ước với API list ca: `startAt=2026-07-16` được quy về `00:00` ngày 15, còn `endAt=2026-07-18` được quy về `23:59:59.999` ngày 18. Vì vậy FE nên truyền ngày cần xem theo cùng cách đang dùng ở danh sách ca.

Response `200`:

```json
{
  "success": true,
  "message": "Lấy lịch trợ giảng của bạn thành công",
  "data": [
    {
      "assistantShiftId": 41,
      "assistantShiftSeriesId": 10,
      "classId": 7,
      "name": "Lớp 11A1 - ca tối",
      "notes": "Có thể đã khóa nhưng vẫn hiển thị trong lịch cá nhân.",
      "startAt": "2026-07-16T11:00:00.000Z",
      "endAt": "2026-07-16T13:00:00.000Z",
      "isLocked": true,
      "selfRegistrationOpenAt": "2026-07-10T00:00:00.000Z",
      "selfRegistrationCloseAt": "2026-07-15T16:59:59.999Z",
      "requiredAssistantCount": 2,
      "series": {
        "assistantShiftSeriesId": 10,
        "name": "Lịch trợ giảng khối 11",
        "isLocked": true
      },
      "assignments": [
        {
          "assistantShiftId": 41,
          "adminId": 12,
          "attendanceStatus": "PRESENT",
          "absenceReason": null,
          "managerNote": null,
          "admin": {
            "adminId": 12,
            "userId": 45,
            "fullName": "Nguyễn Minh Đức",
            "avatarUrl": "https://minio.example.com/..."
          }
        }
      ],
      "courseClass": {
        "classId": 7,
        "name": "11A1"
      }
    }
  ]
}
```

Lỗi FE cần xử lý: `400` khi thiếu/sai ngày hoặc khoảng ngày không hợp lệ; `401/403` khi chưa đăng nhập/thiếu permission. Không có `404` chỉ vì ca hoặc series bị khóa.

### GET `/api/assistant-shifts/assistants`

- Permission: `assistant-shift:get-assistants`.
- Chỉ trả admin có role trợ giảng `16` còn hiệu lực; role này cố định phía server.
- Query hỗ trợ `page`, `limit`, `search`, `sortBy=adminId|createdAt|updatedAt`, `sortOrder=asc|desc`; không có filter nghiệp vụ khác.
- Mỗi item trả `avatarUrl` presigned khi trợ giảng có avatar sẵn sàng.

Request:

```http
GET /api/assistant-shifts/assistants?page=1&limit=20&search=nguyen&sortBy=adminId&sortOrder=asc
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy danh sách trợ giảng thành công",
  "data": [
    {
      "adminId": 25,
      "userId": 60,
      "fullName": "Nguyễn Minh Đức",
      "email": "duc@example.com",
      "avatarUrl": "https://minio.example.com/presigned-avatar-url"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

### GET `/api/assistant-shifts/statistics`

- Permission: `assistant-shift:get-all-by-series`.
- Dùng cho quản lý xem thống kê tất cả trợ giảng có role `16` còn hiệu lực trong khoảng `startAt`/`endAt`.
- Báo cáo lấy ca không phải ca cơ sở có `startAt` nằm trong khoảng cùng quy ước với API danh sách ca; ca/series khóa vẫn được tính. Trợ giảng không có assignment trong khoảng vẫn xuất hiện với tất cả số bằng `0`.
- `totalAssignmentCount`/`totalHours` tính mọi assignment. Các cặp `pendingAssignmentCount`/`pendingHours`, `presentAssignmentCount`/`presentHours`, `absentAssignmentCount`/`absentHours` tính theo từng attendance status. `sundayPresentAssignmentCount`/`sundayPresentHours` chỉ tính assignment `PRESENT` có ca bắt đầu vào Chủ nhật. `presentWorkDayCount` là số ngày khác nhau có ít nhất một assignment `PRESENT`; nhiều ca trong cùng ngày chỉ tính một ngày. Số giờ là tổng `(endAt - startAt)`, làm tròn tối đa hai chữ số thập phân. `registeredShiftCount` và `workedHours` được giữ để tương thích lần lượt với tổng assignment và giờ `PRESENT`.

Request:

```http
GET /api/assistant-shifts/statistics?startAt=2026-07-01&endAt=2026-07-31
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy thống kê trợ giảng thành công",
  "data": {
    "startAt": "2026-06-30T17:00:00.000Z",
    "endAt": "2026-07-31T16:59:59.999Z",
    "assistants": [
      {
        "adminId": 25,
        "userId": 60,
        "fullName": "Nguyễn Minh Đức",
        "totalAssignmentCount": 10,
        "totalHours": 22,
        "pendingAssignmentCount": 2,
        "pendingHours": 3.5,
        "presentAssignmentCount": 7,
        "presentHours": 16.5,
        "absentAssignmentCount": 1,
        "absentHours": 2,
        "sundayPresentAssignmentCount": 2,
        "sundayPresentHours": 4,
        "presentWorkDayCount": 6,
        "registeredShiftCount": 10,
        "workedHours": 16.5
      }
    ]
  }
}
```

Lỗi: `400` khi thiếu/sai `startAt`, `endAt` hoặc khoảng không hợp lệ; `401/403` khi chưa đăng nhập hoặc không có permission.

### GET `/api/assistant-shifts/my/monthly-statistics`

- Permission: `assistant-shift:get-my-monthly-statistics`.
- Status thành công: `200 OK`.
- Không có query hay body. Tháng được xác định theo thời điểm server xử lý request, từ ngày đầu tháng `00:00:00` đến hết ngày cuối tháng.
- Chỉ xét assignment của admin hiện tại và các ca không phải ca cơ sở có `startAt` trong tháng này; ca/series khóa vẫn được tính.
- `workedShiftCount` và `workedHours` chỉ tính assignment có `attendanceStatus = PRESENT`.
- `absentShiftCount` và `absentHours` chỉ tính assignment có `attendanceStatus = ABSENT`.
- `PENDING` không tính vào bất kỳ chỉ số nào. Số giờ là `(endAt - startAt)` của từng ca, cộng dồn và làm tròn tối đa hai chữ số thập phân.

Request:

```http
GET /api/assistant-shifts/my/monthly-statistics
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "success": true,
  "message": "Lấy thống kê ca trợ giảng tháng này thành công",
  "data": {
    "month": "2026-07",
    "workedShiftCount": 8,
    "workedHours": 16.5,
    "absentShiftCount": 1,
    "absentHours": 2
  }
}
```

Lỗi FE cần xử lý: `401/403` khi chưa đăng nhập hoặc thiếu permission. Nếu không có assignment phù hợp, API vẫn trả `200` với tất cả số lượng và số giờ bằng `0`.
