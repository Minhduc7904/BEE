---
name: tuition-payment-sepay-business-rules
description: Thiết kế hoặc cập nhật quy tắc nghiệp vụ thu học phí qua SePay cho BEE. Dùng khi quản lý tài khoản nhận tiền theo khối, tài khoản mặc định xác nhận thủ công, PaymentIntent/PaymentAttempt/VietQR, webhook SePay, đối soát, Socket cập nhật trạng thái, xác nhận PAID hoặc giao dịch trùng/sai tiền.
---

# Quy tắc nghiệp vụ thu học phí qua SePay

## Phạm vi và tài liệu bắt buộc

Skill này chỉ thiết kế **thu học phí**. Không thay đổi, migrate hoặc liên kết `OnlineCourseInvoice` hay `OnlineCoursePaymentAttempt`.

Trước khi thiết kế/hiện thực, đọc đầy đủ `template.md`, `reference-files.md`, skill `database-schema-changes` nếu có thay đổi dữ liệu và các skill lớp triển khai tương ứng. Trước khi sửa symbol đang có, chạy GitNexus impact analysis. Đọc lại tài liệu SePay ngay trước khi code webhook/đối soát.

Payment core phục vụ học phí:

```text
TuitionPayment
  └── PaymentIntent
        └── PaymentAttempt (mã, số tiền, tài khoản và phương thức xác nhận snapshot)
              └── BankTransferTransaction (provider = SEPAY)

Student.grade ──► TuitionGradeReceivingBankAccount ──► ReceivingBankAccount
TuitionCollectionConfiguration ──► defaultManualReceivingBankAccount
```

- `TuitionPayment` là khoản phải thu, giữ trạng thái hiện có `UNPAID`/`PAID`.
- `PaymentAttempt` là một lần hiển thị QR; là điểm match trung tâm, không dùng mapping hiện tại để match attempt cũ.
- `ReceivingBankAccount` là nguồn sự thật về tài khoản thụ hưởng.
- `TuitionCollectionConfiguration` giữ mode vận hành và **một** tài khoản mặc định cho QR xác nhận thủ công.

## Quy tắc chọn tài khoản nhận tiền

1. Lấy `grade` từ `Student.grade`; không nhận grade hay bank từ client.
2. Một `grade` có tối đa một mapping trong `TuitionGradeReceivingBankAccount`; một `ReceivingBankAccount` có thể dùng cho nhiều khối.
3. Chỉ account `ACTIVE` mới được chọn cho attempt mới. Không hard-delete account đã có lịch sử.
4. `TuitionCollectionConfiguration.defaultManualReceivingBankAccountId` là FK đến một account `ACTIVE`. Dùng bảng cấu hình một dòng thay vì cờ `isDefault` trên account để enforce chính xác một bank mặc định.
5. Resolver chọn account theo thứ tự:
   - Mapping của khối đang `ACTIVE`, mode `AUTOMATIC` và luồng auto khả dụng → dùng mapping, `bankSelectionSource = GRADE_MAPPING`, `confirmationMode = AUTOMATIC`.
   - Mode vận hành là `MANUAL_FALLBACK`; hoặc mapping không tồn tại/inactive; hoặc auto không khả dụng do lỗi đã được phân loại → dùng default manual bank, `bankSelectionSource = MANUAL_DEFAULT`, `confirmationMode = MANUAL_FALLBACK`.
   - Default manual bank không có hoặc inactive → không tạo QR, trả lỗi `TUITION_MANUAL_RECEIVING_BANK_UNAVAILABLE`, đồng thời tạo cảnh báo cho admin.
6. Chỉ fallback với lỗi có chủ đích: `GRADE_BANK_NOT_CONFIGURED`, `GRADE_BANK_INACTIVE`, `SEPAY_AUTO_UNAVAILABLE` hoặc mode vận hành đã chuyển. Không fallback khi ownership, amount, dữ liệu, database, xác thực hoặc bảo mật có lỗi.
7. Đổi mapping/default chỉ tác động attempt tạo sau đó. Attempt cũ luôn dùng snapshot account, amount, code và phương thức xác nhận của chính nó.

## Dữ liệu và enum dự kiến

### ReceivingBankAccount

Giữ `bankCode`, `accountNumber`, `accountHolder`, `displayName?`, `status`, `sepayBankAccountId?`, `notes?`, timestamps. `ReceivingBankAccountStatus` tối thiểu có `ACTIVE`, `INACTIVE`. Chỉ người có quyền phù hợp mới xem đầy đủ số tài khoản; không log secret SePay.

### TuitionGradeReceivingBankAccount

Field chính: `id`, `grade Int`, `receivingBankAccountId`, timestamps. Unique `grade`, index `receivingBankAccountId`. Không cần `isActive` ở mapping trong MVP; availability lấy từ account.

### TuitionCollectionConfiguration

Một cấu hình cho phạm vi tổ chức hiện tại, gồm `collectionMode` (`AUTOMATIC`, `MANUAL_FALLBACK`), `defaultManualReceivingBankAccountId`, timestamps và audit người đổi cấu hình nếu dự án có convention tương ứng. Không đặt `defaultManualReceivingBankAccountId` nullable khi đã bật phát hành QR; migration/backfill phải bảo đảm account đó `ACTIVE`.

### PaymentIntent và PaymentAttempt

- `PaymentIntent` snapshot amount, currency, expiry; `PaymentPurpose` hiện chỉ có `TUITION_PAYMENT`.
- `PaymentAttempt` có `attemptCode` unique, `receivingBankAccountId`, amount, QR URL, expiry, status (`PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED`).
- Bổ sung enum snapshot: `PaymentBankSelectionSource` (`GRADE_MAPPING`, `MANUAL_DEFAULT`) và `PaymentConfirmationMode` (`AUTOMATIC`, `MANUAL_FALLBACK`).
- Mã như `HP7A82F` thuộc attempt, ASCII không dấu, random và unique. QR luôn dựng từ snapshot server-side.

### BankTransferTransaction

Dùng unique `[provider, providerTransactionId]`; transaction chưa match vẫn phải lưu. Lưu provider, direction, amount, transaction time, receiving account, content/reference, raw payload và trạng thái đối soát (`RECEIVED`, `MATCHED`, `UNMATCHED`, `AMOUNT_MISMATCH`, `IGNORED`, `ERROR`). Không gắn trực tiếp transaction vào `TuitionPayment`.

## Fallback xác nhận thủ công

SePay là luồng tự động ưu tiên, không phải điều kiện duy nhất để phát hành QR. Default manual bank làm cho phụ huynh vẫn có QR hợp lệ khi khối chưa được cấu hình hoặc luồng tự động suy giảm.

1. `TuitionPayment` luôn giữ `UNPAID` cho đến khi webhook match thành công hoặc admin kiểm tra sao kê xác nhận.
2. Attempt fallback vẫn có QR, account, amount và payment code do BE tạo; trường `confirmationMode = MANUAL_FALLBACK` là bắt buộc trong instruction response.
3. FE client hiển thị rõ: “Đang chờ nhà trường kiểm tra sao kê”, không hứa auto-confirm và không tự đổi sang `PAID`.
4. Admin kiểm tra sao kê theo account snapshot, amount, code và thời gian. Chỉ admin dùng luồng hiện có `UNPAID → PAID`, với `adminId`, `paidAt` thực tế (nếu có) và `notes` bắt buộc chứa `MANUAL_BANK_CHECK` cùng mã tham chiếu/lý do.
5. Giữ audit và notification sau commit; không tạo webhook hoặc `BankTransferTransaction` giả để thay cho sao kê.
6. Khi SePay hồi phục, reconciliation chỉ auto-match khoản còn `UNPAID`. Transaction đến muộn cho khoản đã manual paid chỉ lưu/review, không đổi `paidAt` và không gửi notification lần hai.

## Luồng BE

1. Admin tạo `TuitionPayment`; use case lấy `student.grade` và kiểm tra amount hợp lệ.
2. Endpoint payment instruction gọi `ResolveTuitionReceivingBankUseCase` (hoặc service nghiệp vụ tương đương), lấy mapping grade, configuration và health/mode đã được xác định ở server.
3. Resolver trả account snapshot, `bankSelectionSource`, `confirmationMode` và trạng thái xác nhận. Trong một Unit of Work, tạo `PaymentIntent`/`PaymentAttempt` nếu cần, sinh code và VietQR.
4. Response chỉ chứa instruction server đã quyết định, bao gồm `confirmation.status = PENDING_AUTO_CONFIRMATION` hoặc `AWAITING_ADMIN_RECONCILIATION`; không tin bank/amount/code từ FE.
5. Webhook SePay xác thực raw body theo cấu hình SePay, lưu transaction idempotent rồi chỉ auto-match attempt `AUTOMATIC` khi account/code/amount đều đúng và `TuitionPayment` còn `UNPAID`.
6. Trong một Unit of Work khi match: transaction `MATCHED`, attempt `SUCCEEDED`, intent paid và `TuitionPayment` `UNPAID → PAID`.
7. Sau **commit**, phát notification và Socket event. Lỗi phát event không rollback thanh toán; dùng cơ chế retry/outbox của dự án khi có.
8. Scheduled reconciliation bù webhook thiếu. Với attempt `MANUAL_FALLBACK`, bỏ auto-confirm; admin là nguồn xác nhận.

## Socket: cập nhật trạng thái, không poll liên tục

Socket là push channel; database/API vẫn là nguồn sự thật. Client không poll định kỳ. Khi mở màn hình hoặc reconnect, client gọi một lần `GET .../payment-status` để lấy snapshot, sau đó chỉ nhận event. Event chỉ phát sau commit và có `eventId`, `occurredAt`, `paymentId`, `version` để FE bỏ event trùng/cũ.

### Room và bảo mật

- Tận dụng room cá nhân hiện có `user:{userId}` sau khi Socket JWT được xác thực; không để client tự truyền `paymentId` để join room.
- Client/phụ huynh nhận event qua room của user sở hữu học phí. Nếu student/parent có nhiều user, server phát cho từng user đã được kiểm tra ownership.
- Admin dùng room riêng do server cấp sau khi kiểm tra permission đối soát/thu học phí. Không sử dụng `join-room` tự do cho dữ liệu tài chính.
- Payload không chứa raw webhook, secret hay số tài khoản đầy đủ khi không cần; account chỉ trả dạng đã mask theo quyền.

### Hợp đồng event đề xuất

| Event | Recipient | Khi phát | Payload tối thiểu | Hành vi FE |
| --- | --- | --- | --- | --- |
| `tuition-payment:instruction-updated` | user sở hữu | Attempt/QR mới hoặc resolver chuyển qua default manual bank | `eventId`, `occurredAt`, `paymentId`, `attemptId`, `paymentCode`, `confirmationMode`, `confirmationStatus`, `expiresAt` | Tải lại payment instruction một lần; thay QR/nhãn nếu attempt còn hiệu lực. |
| `tuition-payment:status-updated` | user sở hữu | Mọi thay đổi trạng thái có thể hiển thị | `eventId`, `occurredAt`, `paymentId`, `attemptId?`, `tuitionStatus`, `attemptStatus?`, `confirmationMode?`, `confirmationStatus?`, `paidAt?`, `version` | Đây là event chuẩn; cập nhật UI hoặc gọi snapshot API nếu version lệch. |
| `tuition-payment:manual-review-required` | user sở hữu và admin được phân quyền | Attempt dùng default manual bank hoặc admin cần kiểm tra | payload chuẩn + `bankSelectionSource = MANUAL_DEFAULT`, `messageKey = AWAITING_ADMIN_RECONCILIATION` | Client hiển thị chờ sao kê; admin thêm vào hàng đợi đối soát. |
| `tuition-payment:reconciliation-resolved` | user sở hữu và admin đã thao tác | Admin xác nhận/từ chối resolution | payload chuẩn + `resolution = PAID_CONFIRMED | REJECTED`, `resolvedBy?` | Client chỉ hiển thị thành công khi `tuitionStatus = PAID`; admin cập nhật hàng đợi. |
| `tuition-payment:collection-mode-changed` | admin room | Mode auto/manual hoặc default bank thay đổi | `eventId`, `occurredAt`, `collectionMode`, `defaultManualBankAvailable`, `reason` | Hiển thị/đóng banner vận hành, tải lại dashboard. |

Không cần event `paid` riêng: `tuition-payment:status-updated` là event canonical để tránh hai luồng cập nhật cùng một trạng thái. General notification hiện có có thể được phát song song, nhưng FE thanh toán phải dựa vào event chuyên biệt/snapshot, không suy luận `PAID` chỉ từ nội dung notification.

## Luồng FE client và FE admin

### FE client

1. Chỉ truy cập học phí thuộc ownership của user.
2. Gọi payment instruction và hiển thị QR/bank/amount/code do BE trả về.
3. Nếu `confirmationMode = AUTOMATIC`, hiển thị “Đang chờ xác nhận thanh toán”. Nếu `MANUAL_FALLBACK`, hiển thị “Đang chờ nhà trường kiểm tra sao kê” và lý do an toàn từ `messageKey`.
4. Kết nối Socket JWT; khi nhận event mới hơn `version`, cập nhật state. Khi reconnect hoặc phát hiện thiếu version, gọi snapshot status một lần, không lập vòng poll.
5. Không tự chọn bank, đổi amount/sinh code hay tự xác nhận đã trả.

### FE admin

1. Quản lý account, mapping grade, mode và default manual bank; UI không cho deactivate account đang là default nếu chưa thay default active khác.
2. Dashboard hiển thị grade không có mapping active là “manual default”, không phải “không thể thu online”, miễn default manual bank sẵn sàng.
3. Nhận event admin room, quản lý hàng đợi `AWAITING_ADMIN_RECONCILIATION`, đối chiếu sao kê rồi gọi action xác nhận có reference/lý do bắt buộc.
4. Nếu default manual bank unavailable, hiển thị cảnh báo ưu tiên cao; lúc đó không cho phát QR mới.

## Điều không được làm

- Không đụng `OnlineCourseInvoice`/`OnlineCoursePaymentAttempt` trong scope này.
- Không dùng mapping hiện tại để đối soát attempt cũ.
- Không fallback tất cả exception; không che lỗi xác thực, ownership, dữ liệu hay database bằng QR manual.
- Không tự đánh dấu `PAID` khi SePay lỗi; manual luôn cần admin sao kê, audit và reference.
- Không để client tự vào room thanh toán/admin hoặc coi Socket là nguồn sự thật.
- Không phát Socket trước commit, không để retry event tạo kết quả nghiệp vụ lặp.
- Không yêu cầu unit test trong giai đoạn hiện tại; khi hiện thực, kiểm tra bằng Dashboard/sandbox SePay và kịch bản Socket thực tế.

## Checklist

- [ ] Có đúng một default manual bank `ACTIVE`, luôn được kiểm tra trước khi phát QR fallback.
- [ ] Mapping grade inactive/thiếu và auto unavailable đều trả instruction QR manual có trạng thái chờ sao kê.
- [ ] Lỗi không đủ điều kiện fallback bị trả đúng, không phát QR sai.
- [ ] Attempt snapshot đủ account, amount, code, nguồn chọn bank và mode xác nhận.
- [ ] Auto-match chỉ xử lý attempt `AUTOMATIC`; manual resolution có audit/reference.
- [ ] Event Socket sau commit, versioned/idempotent, room/permission và dữ liệu mask đã rõ.
- [ ] Client không poll định kỳ; chỉ snapshot khi mở/reconnect/lệch version.
- [ ] Không có thay đổi OnlineCourse hay yêu cầu unit test ngoài phạm vi.
