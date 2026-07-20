# Mẫu thiết kế thu học phí SePay: automatic, manual default và Socket

## 1. Bản đồ dữ liệu

```text
Student.grade (Int)
  └── TuitionGradeReceivingBankAccount (grade unique)
        └── ReceivingBankAccount (một account → nhiều grade)

TuitionCollectionConfiguration
  └── defaultManualReceivingBankAccount (một account ACTIVE)

TuitionPayment
  └── PaymentIntent
        └── PaymentAttempt (account + amount + source + confirmation mode snapshot)
              └── BankTransferTransaction (provider = SEPAY)
```

| Thành phần | Trách nhiệm | Rule chính |
| --- | --- | --- |
| `ReceivingBankAccount` | Quản lý tài khoản nhận học phí | Chỉ `ACTIVE` được chọn cho QR mới. |
| `TuitionGradeReceivingBankAccount` | Gán bank auto cho khối | Một grade tối đa một mapping; một bank dùng cho nhiều grade. |
| `TuitionCollectionConfiguration` | Chọn chế độ vận hành và default bank manual | Một default bank active; là nguồn fallback có kiểm soát. |
| `PaymentAttempt` | QR/mã/amount/account của một lần thu | Snapshot cả bank source và confirmation mode. |
| `BankTransferTransaction` | Giao dịch SePay/bank và đối soát | Idempotent theo provider transaction ID. |

## 2. Bảng/enum dự kiến

| Bảng/enum | Field/giá trị cốt lõi | Constraint và lý do |
| --- | --- | --- |
| `receiving_bank_accounts` | `id`, `bankCode`, `accountNumber`, `accountHolder`, `displayName?`, `status`, `sepayBankAccountId?`, `notes?` | `status`: `ACTIVE`, `INACTIVE`; không hard-delete khi đã có lịch sử. |
| `tuition_grade_receiving_bank_accounts` | `id`, `grade`, `receivingBankAccountId` | Unique `grade`; index account ID. |
| `tuition_collection_configurations` | `id`, `collectionMode`, `defaultManualReceivingBankAccountId`, audit/timestamps | Một row trong scope tổ chức; FK default bắt buộc trỏ account `ACTIVE` trước khi phát QR. |
| `payment_intents` | `id`, `purpose = TUITION_PAYMENT`, `amount`, `currency`, `status`, `expiresAt` | Tạo khi khoản thu hợp lệ và resolver chọn được account. |
| `payment_attempts` | `id`, `paymentIntentId`, `attemptCode`, `receivingBankAccountId`, `amount`, `bankSelectionSource`, `confirmationMode`, `status`, `qrCodeUrl`, `expiresAt` | Unique code; `bankSelectionSource`: `GRADE_MAPPING`, `MANUAL_DEFAULT`; `confirmationMode`: `AUTOMATIC`, `MANUAL_FALLBACK`. |
| `bank_transfer_transactions` | `provider`, `providerTransactionId`, `paymentAttemptId?`, `amount`, `transactionAt`, `processingStatus`, `rawPayload` | Unique `[provider, providerTransactionId]`; transaction unmatched vẫn giữ. |

`Student.grade` hiện là `Int`; mapping cũng dùng `grade Int`, không tạo foreign key đến bảng Grade không tồn tại. Khi thay schema, dùng `@map`, relation/onDelete, index và migration theo skill database.

## 3. Decision table: chọn QR

| Điều kiện | Account dùng cho QR | Source | Confirmation | Phản hồi FE |
| --- | --- | --- | --- | --- |
| Mapping grade `ACTIVE`, mode auto, auto khả dụng | Bank mapping grade | `GRADE_MAPPING` | `AUTOMATIC` | Chờ SePay xác nhận. |
| Grade chưa mapping | Default manual bank `ACTIVE` | `MANUAL_DEFAULT` | `MANUAL_FALLBACK` | QR + chờ admin kiểm tra sao kê. |
| Mapping grade `INACTIVE` | Default manual bank `ACTIVE` | `MANUAL_DEFAULT` | `MANUAL_FALLBACK` | QR + chờ admin kiểm tra sao kê. |
| Mode hệ thống `MANUAL_FALLBACK` | Default manual bank `ACTIVE` | `MANUAL_DEFAULT` | `MANUAL_FALLBACK` | QR + chờ admin kiểm tra sao kê. |
| SePay auto unavailable đã được health rule phân loại | Default manual bank `ACTIVE` | `MANUAL_DEFAULT` | `MANUAL_FALLBACK` | QR + chờ admin kiểm tra sao kê. |
| Default manual bank thiếu/inactive | Không tạo QR | — | — | Lỗi `TUITION_MANUAL_RECEIVING_BANK_UNAVAILABLE`; admin được cảnh báo. |
| Ownership, amount, DB, xác thực/bảo mật lỗi | Không tạo QR | — | — | Trả lỗi gốc; không fallback. |

## 4. API dự kiến

| API | Actor/bảo vệ | FE dùng | Quy tắc BE |
| --- | --- | --- | --- |
| `GET /admin/receiving-bank-accounts` | Permission quản lý account | FE admin danh sách/filter | Mask account theo permission. |
| `POST /admin/receiving-bank-accounts` | Permission tạo | FE admin tạo bank | Validate bankCode/account; audit. |
| `PUT /admin/receiving-bank-accounts/:id` | Permission update | FE admin sửa | Không phá snapshot attempt cũ. |
| `POST /admin/receiving-bank-accounts/:id/activate` | Permission update | FE admin bật | Cho phép chọn QR mới. |
| `POST /admin/receiving-bank-accounts/:id/deactivate` | Permission update | FE admin tắt | Chặn nếu là default, trừ khi atomic replace default. |
| `GET/PUT /admin/tuition-collection-configuration` | Permission cấu hình thu học phí | FE admin đổi mode/default | Default phải `ACTIVE`; audit actor/reason. |
| `GET/PUT /admin/tuition-grade-bank-accounts` | Permission cấu hình | FE admin xem/gán grade | Trả rõ trạng thái mapping và fallback. |
| `GET /tuition-payments/my/:id/payment-instructions` | Student ownership | FE client mở thanh toán | Resolver tạo/trả QR và `confirmationMode`, không nhận bank từ FE. |
| `GET /tuition-payments/my/:id/payment-status` | Student ownership | Mở trang/reconnect/lệch version | Snapshot recovery, không dùng cho polling định kỳ. |
| `POST /webhooks/sepay/transactions` | HTTPS + HMAC raw body, không JWT | SePay gọi | Verify, persist idempotent, match snapshot, phản hồi nhanh. |
| `PUT /tuition-payments/:id` *(đang có)* | Admin permission update | Fallback kế thừa | Chỉ `UNPAID → PAID` sau sao kê; notes có `MANUAL_BANK_CHECK` + reference/lý do. |
| `GET /admin/bank-transfer-transactions/reconciliation` | Permission đối soát | FE admin xử lý queue | Filter grade/account/code/status/date/source/mode. |
| `POST /admin/payment-attempts/:id/manual-resolution` | Permission xác nhận thủ công | FE admin resolution | Reference/lý do bắt buộc, audit, không tạo transaction giả. |

## 5. Socket contract

Socket là kênh đẩy trạng thái; API/DB là authoritative. Mọi event phải phát sau commit và cùng envelope:

```ts
type TuitionPaymentSocketEnvelope = {
  eventId: string;
  occurredAt: string;
  paymentId: number;
  attemptId?: number;
  version: number;
  tuitionStatus: 'UNPAID' | 'PAID';
  attemptStatus?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  confirmationMode?: 'AUTOMATIC' | 'MANUAL_FALLBACK';
  confirmationStatus?: 'PENDING_AUTO_CONFIRMATION' | 'AWAITING_ADMIN_RECONCILIATION' | 'CONFIRMED';
};
```

| Event | Room | Trigger | Payload bổ sung | FE xử lý |
| --- | --- | --- | --- | --- |
| `tuition-payment:instruction-updated` | `user:{userId}` đã ownership check | QR/attempt mới hoặc chuyển manual default | `paymentCode`, `expiresAt`, `bankSelectionSource` | Gọi lại instruction một lần. |
| `tuition-payment:status-updated` | `user:{userId}` | Mọi thay đổi hiển thị | envelope chuẩn | Event canonical, merge theo `version`. |
| `tuition-payment:manual-review-required` | user sở hữu + admin room có quyền | Attempt manual được tạo/cần check | `bankSelectionSource`, `messageKey` | Client hiện chờ sao kê; admin thêm queue. |
| `tuition-payment:reconciliation-resolved` | user sở hữu + admin đã thao tác | Manual resolution kết thúc | `resolution`, `resolvedBy?` | Chỉ hiện paid khi `tuitionStatus = PAID`. |
| `tuition-payment:collection-mode-changed` | admin room được server authorize | Mode/default thay đổi | `collectionMode`, `defaultManualBankAvailable`, `reason` | Cập nhật banner/dashboard. |

Không phát event `paid` riêng. Không cho client tự join room tài chính/admin. Client gọi `payment-status` khi mở trang, reconnect hoặc thiếu version; không đặt timer poll.

## 6. Sequence BE/FE

```text
FE Client                BE resolver                     FE Admin / Socket
  | GET payment instruction  |                                  |
  |------------------------->| grade + mapping + config + health |
  |                          | mapping active + auto OK?         |
  |                          |-- có --> QR grade / AUTOMATIC     |
  |                          |-- không -> default active?        |
  |                          |              |-- có --> QR default / MANUAL_FALLBACK
  |<-------------------------| instruction + confirmation state  |
  | chuyển khoản             |                                  |
  |                          | webhook match hoặc admin sao kê   |
  |                          | transaction + attempt + paid commit|
  |<-------------------------| Socket status-updated sau commit   |
  |                          |---- Socket admin review/resolved ->|
```

## 7. Ma trận trạng thái/ngoại lệ

| Tình huống | Attempt | TuitionPayment | FE client |
| --- | --- | --- | --- |
| Grade chưa mapping / mapping inactive | `PENDING` với default manual | `UNPAID` | QR + chờ admin sao kê. |
| Default manual unavailable | Không tạo | `UNPAID` | Không QR; thông báo liên hệ trung tâm. |
| Auto account active | `PENDING`, automatic | `UNPAID` | QR + chờ auto confirm. |
| Webhook đúng account/mã/amount | `SUCCEEDED` | `PAID` | Socket success. |
| Sai account/mã/amount | Không match | `UNPAID` | Chờ admin đối soát. |
| SePay suy giảm | Attempt manual mới dùng default | `UNPAID` | QR + chờ sao kê. |
| Admin check sao kê thành công | Lưu history/resolution | `UNPAID → PAID` | Socket success sau commit. |
| SePay đến muộn sau manual paid | Review/ignored | `PAID` giữ nguyên | Không notification trùng. |

## 8. Quyết định cần chốt

1. Ai có quyền đổi default manual bank và mode; có cần maker-checker không?
2. Có giới hạn thời gian/SLA cho `AWAITING_ADMIN_RECONCILIATION` không?
3. Khi default bank đổi, attempt manual đang `PENDING` tiếp tục nhận vào bank cũ đến expiry hay expire ngay?
4. Parent/student nào nhận Socket event khi một học sinh có nhiều guardian user?
5. `version` lấy từ optimistic-lock, `updatedAt` monotonic hay sequence event riêng?
6. Khi Socket mất kết nối, FE hiển thị banner kết nối lại hay chỉ lấy snapshot im lặng?
7. Partial/overpayment, transfer sai bank, refund và paid-late được xử lý theo policy nào?
