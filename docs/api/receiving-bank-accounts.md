# Receiving Bank Accounts API

## Đồng bộ SePay và xem số dư

### `POST /api/admin/receiving-bank-accounts/sync-from-sepay`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:sync-from-sepay` |
| Status thành công | `200 OK` |
| Request body | Không có |
| Side effect | Upsert dữ liệu xác thực từ SePay và ghi audit `SYNC_RECEIVING_BANK_ACCOUNT_FROM_SEPAY` cho từng bản ghi được tạo/cập nhật |

Backend gọi `GET https://my.sepay.vn/userapi/bankaccounts/list` với `Authorization: Bearer <SEPAY_API_KEY>`. Mỗi tài khoản SePay được đối chiếu đồng thời theo `sepayBankAccountId` và cặp `bankCode + accountNumber`:

- Không có bản ghi cục bộ: tạo mới tài khoản nhận tiền.
- Cả hai khóa cùng trỏ đến một bản ghi: cập nhật `bankCode`, `accountNumber`, `accountHolder`, `sepayBankAccountId`, `sepayStatus` theo SePay.
- Hai khóa trỏ đến hai bản ghi khác nhau: trả `409 Conflict`, không tự gộp hoặc ghi đè dữ liệu.
- `status`, `displayName`, `notes` là dữ liệu vận hành nội bộ nên được giữ nguyên khi đồng bộ. `sepayStatus` là trạng thái chỉ đọc từ SePay: `ACTIVE`, `INACTIVE` hoặc `UNKNOWN` với tài khoản chưa từng đồng bộ.

```json
{
  "success": true,
  "message": "Đồng bộ tài khoản nhận tiền từ SePay thành công",
  "data": { "total": 3, "created": 1, "updated": 1, "unchanged": 1 }
}
```

### `GET /api/admin/receiving-bank-accounts/:id/sepay-balance`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:view-balance` |
| Path param | `id`: số nguyên dương, ID tài khoản nhận tiền cục bộ |
| Status thành công | `200 OK` |
| Side effect | Không ghi audit log |

Backend chỉ gọi SePay khi tài khoản đã có `sepayBankAccountId`; sau đó gọi `GET https://my.sepay.vn/userapi/bankaccounts/details/{sepayBankAccountId}`. `balance` được trả dạng chuỗi để không mất độ chính xác số tiền VND. Số tài khoản tiếp tục bị che trừ khi người dùng là `SUPER_ADMIN` hoặc có permission `receiving-bank-account:view-sensitive`.

```json
{
  "success": true,
  "message": "Lấy số dư tài khoản từ SePay thành công",
  "data": {
    "receivingBankAccountId": 1,
    "sepayBankAccountId": "18",
    "bankCode": "VCB",
    "accountNumber": "*********9999",
    "isAccountNumberMasked": true,
    "balance": "2625076186.00",
    "currency": "VND",
    "isSepayAccountActive": true,
    "lastTransactionAt": "2023-08-09 07:59:48",
    "fetchedAt": "2026-07-20T10:00:00.000Z"
  }
}
```

Nếu đồng bộ phát hiện một ID SePay/cặp ngân hàng-số tài khoản trỏ đến nhiều bản ghi cục bộ, hoặc tài khoản chưa có ID SePay khi xem số dư, API trả `409`. Thiếu `SEPAY_API_KEY`, SePay không phản hồi, hoặc dữ liệu SePay trả về không hợp lệ sẽ trả `503`. Không ghi API key hoặc số tài khoản đầy đủ vào audit log.

## Phạm vi và xác thực

- Base URL: `/api`.
- Actor: quản trị viên đã đăng nhập bằng Bearer JWT.
- Resource permissions: `receiving-bank-account:get-all`, `receiving-bank-account:create`, `receiving-bank-account:update`.
- Số tài khoản bị che mặc định. Chỉ `SUPER_ADMIN` hoặc người có `receiving-bank-account:view-sensitive` nhận số đầy đủ.
- Mọi thao tác ghi đều tạo audit log; không có API xóa cứng tài khoản nhận tiền.

## Kiểu dữ liệu response

```json
{
  "receivingBankAccountId": 1,
  "bankCode": "MB",
  "accountNumber": "******6789",
  "isAccountNumberMasked": true,
  "accountHolder": "TRUNG TÂM BEE",
  "displayName": "Tài khoản thu học phí",
  "status": "ACTIVE",
  "sepayBankAccountId": "sepay-account-01",
  "sepayStatus": "ACTIVE",
  "notes": null,
  "createdAt": "2026-07-20T08:00:00.000Z",
  "updatedAt": "2026-07-20T08:00:00.000Z"
}
```

## `GET /api/admin/receiving-bank-accounts`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:get-all` |
| Status thành công | `200 OK` |
| Side effect | Không có audit log |

Query tùy chọn: `page` (>= 1), `limit` (1-1000), `search` (tối đa 255 ký tự), `status` (`ACTIVE` hoặc `INACTIVE`), `bankCode` (tối đa 30 ký tự), `sortBy` (`receivingBankAccountId`, `bankCode`, `accountHolder`, `displayName`, `status`, `createdAt`, `updatedAt`) và `sortOrder` (`asc`, `desc`).

Response là `PaginationResponseDto`:

```json
{
  "success": true,
  "message": "Lấy danh sách tài khoản nhận tiền học phí thành công",
  "data": [{ "receivingBankAccountId": 1, "accountNumber": "******6789" }],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1, "hasPrevious": false, "hasNext": false }
}
```

## `POST /api/admin/receiving-bank-accounts`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:create` |
| Status thành công | `201 Created` |
| Side effect | Tạo account ở trạng thái `ACTIVE` và audit `CREATE_RECEIVING_BANK_ACCOUNT` |

```json
{
  "bankCode": "MB",
  "accountNumber": "0123456789",
  "accountHolder": "TRUNG TÂM BEE",
  "displayName": "Tài khoản thu học phí",
  "sepayBankAccountId": "sepay-account-01",
  "notes": "Dùng cho năm học 2026-2027"
}
```

`bankCode`, `accountNumber`, `accountHolder` là bắt buộc; độ dài tối đa lần lượt 30, 50, 150. Cặp `bankCode` và `accountNumber` phải duy nhất.

## `PUT /api/admin/receiving-bank-accounts/:id`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:update` |
| Status thành công | `200 OK` |
| Side effect | Audit `UPDATE_RECEIVING_BANK_ACCOUNT`; không thay đổi snapshot của payment attempt cũ |

`id` là số nguyên dương. Body nhận các trường tùy chọn giống endpoint tạo, trừ trạng thái; trạng thái chỉ thay đổi qua endpoint activate/deactivate.

```json
{
  "displayName": "Tài khoản thu học phí chính",
  "notes": "Đã kiểm tra thông tin"
}
```

## `POST /api/admin/receiving-bank-accounts/:id/activate`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:update` |
| Status thành công | `200 OK` |
| Side effect | Đặt trạng thái `ACTIVE`, audit `ACTIVATE_RECEIVING_BANK_ACCOUNT` nếu có thay đổi |

Không có request body. Account `ACTIVE` đã có vẫn trả dữ liệu hiện tại, không tạo audit giả.

## `POST /api/admin/receiving-bank-accounts/:id/deactivate`

| Thuộc tính | Giá trị |
| --- | --- |
| Permission | `receiving-bank-account:update` |
| Status thành công | `200 OK` |
| Side effect | Đặt trạng thái `INACTIVE`, audit `DEACTIVATE_RECEIVING_BANK_ACCOUNT` nếu có thay đổi |

Không có request body. Nếu account là `defaultManualReceivingBankAccountId` của cấu hình thu học phí hiện hành, API trả `409 Conflict`; FE phải thay default bank đang hoạt động qua API cấu hình trước. Payment attempt cũ vẫn dùng snapshot account cũ.

## Lỗi FE cần xử lý

| HTTP status | Trường hợp |
| --- | --- |
| `400` | Query/body không hợp lệ theo validation decorator. |
| `401` / `403` | Chưa đăng nhập hoặc thiếu permission. |
| `404` | Account với `:id` không tồn tại. |
| `409` | Tạo/cập nhật trùng cặp ngân hàng-số tài khoản; hoặc deactivate account default. |
