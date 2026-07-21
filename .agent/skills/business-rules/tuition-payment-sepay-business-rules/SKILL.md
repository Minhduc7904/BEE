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
   - Mapping của khối có tài khoản vận hành `status = ACTIVE`, `sepayStatus = ACTIVE`, mode `AUTOMATIC` và luồng auto khả dụng → dùng mapping, `bankSelectionSource = GRADE_MAPPING`, `confirmationMode = AUTOMATIC`.
   - Mode vận hành là `MANUAL_FALLBACK`; hoặc mapping không tồn tại/inactive; hoặc `sepayStatus` là `UNKNOWN`/`INACTIVE`; hoặc auto không khả dụng do lỗi đã được phân loại → dùng default manual bank, `bankSelectionSource = MANUAL_DEFAULT`, `confirmationMode = MANUAL_FALLBACK`.
   - Default manual bank không có hoặc inactive → không tạo QR, trả lỗi `TUITION_MANUAL_RECEIVING_BANK_UNAVAILABLE`, đồng thời tạo cảnh báo cho admin.
6. Chỉ fallback với lỗi có chủ đích: `GRADE_BANK_NOT_CONFIGURED`, `GRADE_BANK_INACTIVE`, `SEPAY_BANK_STATUS_UNKNOWN`, `SEPAY_BANK_INACTIVE`, `SEPAY_AUTO_UNAVAILABLE` hoặc mode vận hành đã chuyển. Không fallback khi ownership, amount, dữ liệu, database, xác thực hoặc bảo mật có lỗi.
7. Đổi mapping/default chỉ tác động attempt tạo sau đó. Attempt cũ luôn dùng snapshot account, amount, code và phương thức xác nhận của chính nó.

## Dữ liệu và enum dự kiến

### ReceivingBankAccount

Giữ `bankCode`, `accountNumber`, `accountHolder`, `displayName?`, `status`, `sepayBankAccountId?`, `sepayStatus`, `notes?`, timestamps. `ReceivingBankAccountStatus` tối thiểu có `ACTIVE`, `INACTIVE`; đây là trạng thái vận hành cục bộ. `SepayBankAccountStatus` có `UNKNOWN`, `ACTIVE`, `INACTIVE` và chỉ được cập nhật từ API SePay khi đồng bộ. Chỉ `status = ACTIVE` và `sepayStatus = ACTIVE` mới cho attempt tự động; `sepayStatus = UNKNOWN` hoặc `INACTIVE` không chặn QR fallback thủ công nếu `status = ACTIVE`. Chỉ người có quyền phù hợp mới xem đầy đủ số tài khoản; không log secret SePay.

### TuitionGradeReceivingBankAccount

Có đúng 12 bản ghi bền vững cho `grade` từ `1` đến `12`; migration phải tạo idempotent các bản ghi còn thiếu. Field chính: `id`, `grade Int`, `receivingBankAccountId?`, timestamps. Unique `grade`, index `receivingBankAccountId`. `receivingBankAccountId = null` nghĩa là khối chưa gán bank tự động và **bắt buộc** dùng default manual bank, không phải lỗi cấu hình. Khi có ID, availability auto vẫn lấy từ tài khoản: chỉ `status = ACTIVE` và `sepayStatus = ACTIVE` mới tạo attempt `AUTOMATIC`; mọi trạng thái còn lại dùng fallback thủ công nếu default manual bank sẵn sàng.

### TuitionCollectionConfiguration

Một cấu hình cho phạm vi tổ chức hiện tại, gồm `collectionMode` (`AUTOMATIC`, `MANUAL_FALLBACK`), `defaultManualReceivingBankAccountId`, timestamps và audit người đổi cấu hình nếu dự án có convention tương ứng. Không đặt `defaultManualReceivingBankAccountId` nullable khi đã bật phát hành QR; migration/backfill phải bảo đảm account đó có trạng thái vận hành `status = ACTIVE`. `sepayStatus` không phải điều kiện dùng tài khoản default cho fallback thủ công.

### PaymentIntent và PaymentAttempt

- `PaymentIntent` snapshot amount, currency, expiry; `PaymentPurpose` hiện chỉ có `TUITION_PAYMENT`. Mọi API tạo `TuitionPayment` phải tạo đúng một intent trong **cùng Unit of Work**: học phí `UNPAID` tạo intent `PENDING`, học phí được tạo trực tiếp `PAID` tạo intent `PAID`. `amount` phải đã xác định (không được `null`) vì intent không lưu số tiền nullable. `expiresAt = null` nghĩa là intent có hiệu lực vô hạn; chỉ intent có `expiresAt` khác `null` và không muộn hơn thời điểm kiểm tra mới hết hạn.
- `PaymentAttempt` có `attemptCode` unique, `receivingBankAccountId`, amount, QR URL, expiry, status (`PENDING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED`). `expiresAt` là bắt buộc: attempt `PENDING` luôn có hạn QR cụ thể; attempt lịch sử giữ thời điểm giao dịch hoặc thời điểm chuyển trạng thái, không có QR vô hạn.
- Khi học sinh gọi payment instruction, chỉ tái sử dụng attempt `PENDING` còn ít nhất `60` giây. Attempt còn dưới `60` giây, hoặc đã hết hạn, phải được chuyển `EXPIRED` với `expiresAt = now - 1 giây` rồi tạo attempt/QR mới trong cùng Unit of Work. QR cũ không còn được auto-match; FE phải thay toàn bộ code, QR và `expiresAt` bằng response mới.
- Bổ sung enum snapshot: `PaymentBankSelectionSource` (`GRADE_MAPPING`, `MANUAL_DEFAULT`) và `PaymentConfirmationMode` (`AUTOMATIC`, `MANUAL_FALLBACK`).
- Mã như `HP7A82F` thuộc attempt, ASCII không dấu, random và unique. QR luôn dựng từ snapshot server-side.

### Chuyển đổi `PaymentAttempt.expiresAt` sang bắt buộc

- Triển khai theo thứ tự: phiên bản ứng dụng mới phải luôn truyền `expiresAt` khi tạo attempt; sau đó migration backfill; cuối cùng mới đổi cột thành `NOT NULL`. Không chạy contract khi còn instance cũ có thể tạo attempt thiếu hạn.
- Backfill row cũ có `expires_at IS NULL`: `PENDING` chuyển sang `EXPIRED` và đặt `expires_at = now - 1 giây`; `SUCCEEDED`, `FAILED`, `CANCELLED` đặt bằng `updated_at`, fallback `created_at` để giữ lịch sử. Các trạng thái legacy còn lại cũng phải nhận `updated_at`/`created_at` trước `NOT NULL` để migration không bị kẹt.
- Attempt `SUCCEEDED` được tạo từ đối soát thủ công không phát QR: đặt `expiresAt = BankTransferTransaction.transactionAt`. `PaymentIntent.expiresAt` vẫn có thể `null` và giữ ý nghĩa vô hạn, không thuộc thay đổi này.

### BankTransferTransaction

Dùng unique `[provider, providerTransactionId]`; transaction chưa match vẫn phải lưu. Lưu provider, direction, amount, transaction time, `receivingAccountNumber`, `receivingBankAccountId?`, content/reference, raw payload và trạng thái đối soát (`RECEIVED`, `MATCHED`, `UNMATCHED`, `AMOUNT_MISMATCH`, `IGNORED`, `ERROR`). Không gắn trực tiếp transaction vào `TuitionPayment`.

- Với webhook tiền vào, BE tìm `ReceivingBankAccount` theo `accountNumber` từ SePay. Chỉ khi kết quả đúng **một** account nội bộ mới lưu `receivingBankAccountId`; không có hoặc nhiều account cùng số thì giữ `null`, không suy đoán theo nội dung/số tiền.
- Đây là liên kết tra soát có thể nullable, `onDelete: SetNull` để giao dịch lịch sử vẫn còn. Nó không thay thế snapshot `PaymentAttempt.receivingBankAccountId`; auto-match vẫn yêu cầu ID nhận diện từ webhook khớp chính xác ID snapshot của attempt.

### SepayTransactionSyncCursor

Là checkpoint riêng của đồng bộ SePay V2, không phải bảng log cron và không được dùng `BankTransferTransaction.providerTransactionId` làm cursor. Giữ `scope` unique (ban đầu là `IN_ALL`), `lastSinceId?` UUID, `lastSyncedAt?`, thông tin lỗi vận hành đã lọc và timestamps. `lastSinceId = null` nghĩa là chưa có checkpoint.

- Mỗi scope có đúng một cursor; không đổi filter/phạm vi của scope đang dùng vì `sinceId` chỉ có ý nghĩa trong cùng truy vấn SePay. Khi cần scope mới, tạo row mới.
- Đồng bộ xử lý từng trang theo thứ tự tăng dần, lưu giao dịch idempotent rồi cập nhật `lastSinceId` và `lastSyncedAt` trong **cùng Unit of Work**. Chỉ checkpoint đến transaction cuối của trang sau khi toàn bộ trang commit thành công.
- Lỗi provider, database hoặc runtime không được advance `lastSinceId`; chỉ cập nhật lỗi vận hành ngoài transaction checkpoint hoặc rollback toàn bộ lần xử lý theo chiến lược use case. Không lưu API key, chữ ký hay raw payload trong lỗi.

### Đồng bộ SePay API v2, idempotency và khóa job

- `POST /admin/bank-transfer-transactions/sync-sepay` dùng permission `bank-transfer-transaction:sync-sepay`; chỉ admin được gọi. Scheduler `BankTransferTransactionScheduler` chạy tại giây 0 của mỗi 5 phút (`0 */5 * * * *`, `Asia/Ho_Chi_Minh`) và gọi lại đúng `SepayTransactionSyncService`, không sao chép logic webhook hay logic đối soát.
- Cả webhook và đồng bộ API v2 phải đưa giao dịch vào cùng `SepayTransactionProcessorService`. Lưu giao dịch, xác định tài khoản nhận, auto-match attempt, cập nhật attempt/intent/học phí và lấy kết quả notification phải giữ đúng thứ tự hiện có; notification chỉ gửi sau commit.
- `BankTransferTransaction.sepayV2TransactionId` là UUID từ API v2, unique nhưng nullable cho giao dịch webhook chưa liên kết. Processor tìm trùng theo UUID v2 trước, sau đó theo `[provider, providerTransactionId]`; chỉ khi có đúng một candidate cùng `provider + reference + amount + receivingAccountNumber` mới được liên kết webhook với API v2. Không gộp theo nội dung, mã học phí hoặc amount đơn lẻ.
- `BackgroundJobLock` có một dòng cho mỗi `BackgroundJob`. Acquire phải atomic bằng lease: job đang có `leaseExpiresAt > now` thì không tạo run mới; lease hết hạn mới được worker mới thay token. Release bắt buộc kiểm tra `lockToken` để worker cũ không xóa lock của worker mới.
- Khi job đang chạy, API trả `409` với code ổn định `SEPAY_TRANSACTION_SYNC_ALREADY_RUNNING` và `retryAt`; FE admin chỉ hiển thị trạng thái đang đồng bộ, không retry song song. Job run ghi `RUNNING` → `SUCCEEDED` hoặc `FAILED`; lần gọi admin ghi audit success/fail, không log API key hoặc raw payload.
- Job mới được tạo với `isEnabled = true`; scheduler luôn kiểm tra `BackgroundJob.isEnabled` trước khi lấy lock. Nếu admin tắt job, lượt cron được bỏ qua và không gọi SePay; API thủ công vẫn được phép chạy để vận hành/khắc phục sự cố.
- API quản trị job chỉ cho phép admin có permission riêng xem `BackgroundJob`, `BackgroundJobLock`, `BackgroundJobRun` và `SepayTransactionSyncCursor`; lock/run/cursor chỉ đọc. `PUT BackgroundJob` chỉ đổi `isEnabled`, có audit before/after và không được sửa cron/timezone/runtime qua API vì lịch cron đang do Scheduler source code sở hữu. Không trả `lockToken`, API key hay raw payload cho FE.
- Đồng bộ gọi `GET https://userapi.sepay.vn/v2/transactions` với `transfer_type=in`, `per_page=100`, `timestamp_format=iso8601` và `since_id` của scope `IN_ALL`. SePay trả các UUID lớn hơn checkpoint theo thứ tự tăng dần; sau mỗi trang đã xử lý và commit, cập nhật cursor sang UUID cuối trang trong cùng Unit of Work. Có khoảng nghỉ giữa các trang để tôn trọng giới hạn provider.
- Lần đồng bộ đầu tiên khi cursor chưa có checkpoint dùng response mặc định của SePay; vận hành cần chủ động quyết định/backfill lịch sử riêng nếu cần đối soát dữ liệu cũ hơn phạm vi provider trả về. Không tự suy đoán hoặc lùi cursor trong luồng định kỳ.

## Trạng thái giao dịch ngân hàng và đối soát

`processingStatus` và `reconciliationStatus` là hai trục độc lập, không được dùng thay thế cho nhau:

- `processingStatus` trả lời: webhook/BE đã xử lý giao dịch này như thế nào ở luồng tự động?
- `reconciliationStatus` trả lời: giao dịch đã được dùng để xác nhận học phí hay chưa, và nếu có thì do BE tự động hay admin xác nhận?
- FE admin phải hiển thị cả hai. Chỉ `MATCHED` cùng `AUTOMATIC` hoặc `ADMIN` mới là một giao dịch đã được dùng để xác nhận. `RECEIVED` không có nghĩa là học phí đã `PAID`.

### `BankTransferProcessingStatus`

| Enum              | Ý nghĩa chính xác                                                                                                                                                            | Khi webhook hiện tại gán                                                                                                                                                                                                                                   | Học phí/attempt sau đó                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RECEIVED`        | Giao dịch tiền vào đã qua các kiểm tra ban đầu của auto-match: tìm được attempt automatic đang `PENDING`, chưa hết hạn, đúng account và đúng amount. Chưa phải kết quả cuối. | Là trạng thái trung gian trước khi BE đọc `PaymentIntent` và `TuitionPayment`. Trong webhook đồng bộ hiện tại, trạng thái này thường không được commit lâu dài vì sẽ chuyển tiếp ngay.                                                                     | Chưa được coi là `PAID`. Nếu aggregate còn hợp lệ, chuyển `MATCHED`; nếu không, chuyển `UNMATCHED` hoặc `IGNORED`.                                                        |
| `MATCHED`         | Giao dịch đã được dùng để xác nhận thanh toán.                                                                                                                               | Auto-match thành công hoặc admin đối soát thủ công thành công.                                                                                                                                                                                             | Attempt liên quan `SUCCEEDED`, intent `PAID`, học phí `PAID`; `reconciliationStatus` là `AUTOMATIC` hoặc `ADMIN`.                                                         |
| `UNMATCHED`       | Giao dịch tiền vào hợp lệ nhưng không xác định được một attempt hợp lệ để auto-match. Đây không phải lỗi provider.                                                           | Không có attempt/mã; mã trong `content` và `code` mâu thuẫn; mã không tồn tại; account nhận không khớp snapshot; hoặc `TP:<id>` không thuộc intent của attempt. Nếu intent của attempt bị mất thì bản ghi ban đầu `RECEIVED` cũng bị hạ thành `UNMATCHED`. | Không đổi attempt/intent/học phí. Bản ghi vẫn `UNRECONCILED` để admin review.                                                                                             |
| `AMOUNT_MISMATCH` | Đã tìm được attempt automatic hợp lệ và đúng account, nhưng `transferAmount` khác chính xác amount snapshot của attempt.                                                     | Chỉ sau khi đã qua kiểm tra tiền vào, attempt automatic `PENDING`, chưa hết hạn và đúng account.                                                                                                                                                           | Không đổi attempt/intent/học phí; vẫn `UNRECONCILED`. Không tự cộng nhiều giao dịch hay tự chấp nhận thiếu/thừa tiền.                                                     |
| `IGNORED`         | Giao dịch hợp lệ về cấu trúc nhưng không được phép ảnh hưởng auto-payment.                                                                                                   | Tiền ra; attempt manual; attempt không còn `PENDING`; attempt hết hạn; intent/học phí không còn chờ thanh toán; intent hết hạn; hoặc nội dung `TP:<id>` không khớp intent.                                                                                 | Không đổi sang `PAID`; không gửi notification thành công. Bản ghi được giữ để tra soát và thường vẫn `UNRECONCILED`.                                                      |
| `ERROR`           | Dành cho lỗi xử lý có thể lưu vết sau khi đã nhận giao dịch. Không dùng để biểu diễn giao dịch sai mã/sai tiền.                                                              | Webhook hiện tại **chưa có nhánh nào ghi** `ERROR`: chữ ký/payload sai trả `400` và không lưu; lỗi database/runtime rollback transaction để SePay retry.                                                                                                   | Không thay đổi học phí. Khi sau này bổ sung trạng thái này, phải lưu lý do kỹ thuật an toàn để vận hành retry/review, không lộ secret hay raw payload trên API danh sách. |

`BankTransferReconciliationStatus` phải được đọc kèm với bảng trên:

| Enum           | Ý nghĩa                                                     | Giá trị processing hợp lệ theo luồng hiện tại                                                                                             |
| -------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `UNRECONCILED` | Chưa được dùng để xác nhận học phí, vẫn ở hàng chờ review.  | Có thể đi cùng `UNMATCHED`, `AMOUNT_MISMATCH`, `IGNORED` và các trạng thái cũ cần tra soát. Không suy ra giao dịch có thể auto-match lại. |
| `AUTOMATIC`    | Webhook đã auto-match thành công trong cùng Unit of Work.   | `MATCHED`.                                                                                                                                |
| `ADMIN`        | Admin đã chọn giao dịch trong xác nhận thủ công thành công. | `MATCHED`.                                                                                                                                |

Không cho phép đảo `AUTOMATIC`/`ADMIN` về `UNRECONCILED` chỉ bằng API vận hành. Học phí cũng không được đảo `PAID → UNPAID`.

### Khác nhau giữa `RECEIVED` và `MATCHED`

`RECEIVED` chỉ có nghĩa là giao dịch **có vẻ đủ điều kiện để tiếp tục auto-match**. BE vẫn phải kiểm tra intent còn `PENDING`, intent chưa hết hạn, học phí còn `UNPAID` và `TP:<id>` (nếu có) đúng với intent. `MATCHED` là kết quả sau cùng của một Unit of Work: transaction, attempt, intent và tuition payment đã cùng được cập nhật. Vì vậy FE không được hiển thị thành công hoặc đổi trạng thái học phí khi chỉ thấy `RECEIVED`.

## Ma trận xử lý webhook SePay hiện tại

Mỗi webhook chỉ được xử lý sau khi xác thực HMAC-SHA256 raw body. Bản ghi có unique `[provider, providerTransactionId]`; retry cùng ID không tạo bản ghi mới, không đổi dữ liệu và không gửi notification lần hai.

| Tình huống                                                                                             | `processingStatus` cuối              | `reconciliationStatus` | Điều xảy ra                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Chữ ký, timestamp hoặc payload bắt buộc sai                                                            | Không có bản ghi                     | —                      | Trả `400`; SePay retry theo cơ chế của provider.                                                                                                                     |
| Provider transaction ID đã tồn tại                                                                     | Giữ nguyên trạng thái cũ             | Giữ nguyên             | Idempotent: trả thành công, không xử lý lại.                                                                                                                         |
| Giao dịch tiền ra (`transferType !== in`)                                                              | `IGNORED`                            | `UNRECONCILED`         | Lưu để tra soát, không tìm/không xác nhận học phí.                                                                                                                   |
| Tiền vào nhưng không có content/code hoặc không tìm được attempt                                       | `UNMATCHED`                          | `UNRECONCILED`         | Lưu giao dịch, không đổi học phí; admin tìm bằng `search` theo content/reference/account để review.                                                                  |
| `content` có `HP...                                                                                    | TP:id` nhưng code webhook khác mã đó | `UNMATCHED`            | `UNRECONCILED`                                                                                                                                                       | Không tin mã mâu thuẫn; không auto-match. |
| Mã có attempt nhưng `TP:id` không thuộc intent của attempt                                             | `UNMATCHED`                          | `UNRECONCILED`         | Ngăn mã bị ghép sai học phí; không auto-match.                                                                                                                       |
| Attempt là `MANUAL_FALLBACK`                                                                           | `IGNORED`                            | `UNRECONCILED`         | Luôn chờ admin sao kê; webhook không auto-confirm manual attempt.                                                                                                    |
| Attempt automatic đã `SUCCEEDED`, `FAILED`, `CANCELLED` hoặc không còn `PENDING`                       | `IGNORED`                            | `UNRECONCILED`         | Lưu giao dịch đến muộn/trùng nghiệp vụ; không xác nhận lần hai.                                                                                                      |
| Attempt automatic đã hết hạn                                                                           | `IGNORED`                            | `UNRECONCILED`         | Không auto-match, không tự tạo QR/attempt mới. FE phải lấy instruction mới theo API.                                                                                 |
| Account nhận trong webhook khác account snapshot của attempt hoặc account snapshot không còn tồn tại   | `UNMATCHED`                          | `UNRECONCILED`         | Không đổi học phí; cần admin review. Thay đổi `status`/`sepayStatus` hiện tại của account không làm hỏng snapshot cũ nếu account vẫn tồn tại và số account vẫn khớp. |
| Đúng mã/account nhưng số tiền thiếu hoặc thừa                                                          | `AMOUNT_MISMATCH`                    | `UNRECONCILED`         | Không tự xác nhận, attempt vẫn `PENDING`, intent/học phí vẫn chờ. Không tự cộng các giao dịch partial.                                                               |
| Đúng mã/account/amount nhưng payment intent không còn tồn tại                                          | `UNMATCHED`                          | `UNRECONCILED`         | Lưu giao dịch, không đổi học phí; cần xử lý dữ liệu cũ/review.                                                                                                       |
| Đúng mã/account/amount nhưng intent hết hạn                                                            | `IGNORED`                            | `UNRECONCILED`         | Intent `PENDING` được đánh `EXPIRED`; không auto-confirm.                                                                                                            |
| Đúng mã/account/amount nhưng học phí đã `PAID`, intent không `PENDING`, hoặc `TP:id` sai               | `IGNORED`                            | `UNRECONCILED`         | Lưu để tra soát, giữ `paidAt` cũ, không notification lần hai.                                                                                                        |
| Đúng mã, account, amount; attempt automatic `PENDING`; intent `PENDING` chưa hết hạn; học phí `UNPAID` | `MATCHED`                            | `AUTOMATIC`            | Cùng transaction: attempt `SUCCEEDED`, intent `PAID`, học phí `PAID` với `paidAt` từ SePay; sau commit mới notification/Socket.                                      |
| Lỗi database/runtime sau khi bắt đầu xử lý                                                             | Không commit bản ghi/trạng thái      | —                      | Toàn bộ transaction rollback để SePay retry. Không giả mạo `ERROR` trong code hiện tại.                                                                              |

## Quy tắc đối soát thủ công với danh sách giao dịch

API `POST /api/tuition-payments/:id/confirm-manual-payment` nhận `bankTransferTransactionIds?: number[]`. Không truyền danh sách vẫn cho phép admin xác nhận theo sao kê ngoài hệ thống, nhưng bắt buộc audit/reference/reason theo quy trình vận hành.

| Tình huống manual                                                                      | Kết quả hiện tại                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Học phí không `UNPAID`                                                                 | Từ chối; không đảo `PAID → UNPAID`.                                                                                                                                                                   |
| Học phí cũ chưa có `PaymentIntent`                                                     | Tạo bù intent trong cùng Unit of Work trước khi xác nhận `PAID`.                                                                                                                                      |
| Danh sách rỗng hoặc chứa ID trùng                                                      | Từ chối.                                                                                                                                                                                              |
| Một ID không tồn tại hoặc đã `AUTOMATIC`/`ADMIN` đối soát                              | Từ chối và rollback toàn bộ danh sách.                                                                                                                                                                |
| Một giao dịch không xác định đúng một tài khoản nhận đang hoạt động cho manual         | Từ chối và rollback toàn bộ danh sách.                                                                                                                                                                |
| Giao dịch chưa gắn attempt                                                             | Tạo một `PaymentAttempt` `MANUAL_FALLBACK` `SUCCEEDED` cho giao dịch đó, rồi chuyển transaction thành `MATCHED` + `ADMIN`.                                                                            |
| Nhiều giao dịch hợp lệ chưa gắn attempt                                                | Mỗi giao dịch có attempt manual lịch sử riêng; toàn bộ cùng xác nhận một học phí trong một transaction.                                                                                               |
| Nhiều giao dịch gắn cùng attempt manual `PENDING`                                      | Attempt được chuyển `SUCCEEDED` một lần; tất cả transaction được chọn thành `MATCHED` + `ADMIN`.                                                                                                      |
| Giao dịch đã gắn attempt `AUTOMATIC` (bao gồm giao dịch `AMOUNT_MISMATCH` của QR auto) | **Từ chối trong API hiện tại**, dù transaction còn `UNRECONCILED`. Admin chỉ có thể xác nhận không gắn transaction hoặc cần thay đổi policy/code riêng. Đây là giới hạn cần hiển thị rõ cho vận hành. |
| Tổng các giao dịch thiếu, đủ hoặc thừa so với học phí                                  | Khi các giao dịch thỏa điều kiện manual ở trên, vẫn cho xác nhận. Backend không so sánh từng amount hoặc tổng amount; ID, reference, reason được audit.                                               |
| Không truyền `paidAt`                                                                  | Có danh sách: dùng `transactionAt` muộn nhất; không có danh sách: dùng thời điểm admin xác nhận.                                                                                                      |
| Một phần tử trong danh sách lỗi                                                        | Rollback tất cả: không có transaction nào bị đánh dấu `ADMIN`, học phí vẫn `UNPAID`.                                                                                                                  |

Quy tắc “không cộng partial tự động” chỉ áp dụng auto-match. Nếu nghiệp vụ muốn đối soát các giao dịch `AMOUNT_MISMATCH` gắn attempt automatic bằng danh sách, phải chốt policy mới và sửa use case một cách rõ ràng; không được âm thầm coi chúng là `MATCHED`.

## Tìm kiếm và vận hành hàng chờ admin

`GET /api/admin/bank-transfer-transactions` và API thống kê đều nhận `search`. Truy vấn hiện tìm chuỗi con trong `providerTransactionId`, `receivingAccountNumber`, **`content` (nội dung chuyển khoản)** và `reference`; `content` không có filter riêng. Có thể kết hợp `search` với `processingStatus`, `reconciliationStatus`, khoảng amount, account và thời gian để tạo hàng chờ. Độ nhạy hoa/thường phụ thuộc collation MySQL đang dùng.

## Fallback xác nhận thủ công

SePay là luồng tự động ưu tiên, không phải điều kiện duy nhất để phát hành QR. Default manual bank làm cho phụ huynh vẫn có QR hợp lệ khi khối chưa được cấu hình hoặc luồng tự động suy giảm.

1. `TuitionPayment` luôn giữ `UNPAID` cho đến khi webhook match thành công hoặc admin kiểm tra sao kê xác nhận.
2. Attempt fallback vẫn có QR, account, amount và payment code do BE tạo; trường `confirmationMode = MANUAL_FALLBACK` là bắt buộc trong instruction response.
3. FE client hiển thị rõ: “Đang chờ nhà trường kiểm tra sao kê”, không hứa auto-confirm và không tự đổi sang `PAID`.
4. Admin kiểm tra sao kê theo account snapshot, nội dung chuyển khoản, thời gian và các bằng chứng vận hành phù hợp. Admin có thể chọn một hoặc nhiều `BankTransferTransaction` chưa đối soát để thực hiện `UNPAID → PAID`; chính sách thủ công không bắt buộc số tiền từng giao dịch hoặc tổng giao dịch phải khớp chính xác học phí. Mọi ID giao dịch, `adminId`, `paidAt` thực tế (nếu có), mã tham chiếu và lý do phải được ghi vào audit/notes.
5. Giữ audit và notification sau commit; không tạo webhook hoặc `BankTransferTransaction` giả để thay cho sao kê.
6. Khi SePay hồi phục, reconciliation chỉ auto-match khoản còn `UNPAID`. Transaction đến muộn cho khoản đã manual paid chỉ lưu/review, không đổi `paidAt` và không gửi notification lần hai.

## Luồng BE

1. Admin tạo `TuitionPayment`; use case lấy `student.grade`, kiểm tra amount hợp lệ và tạo `PaymentIntent` đồng bộ trong cùng transaction. Điều này áp dụng cho API tạo một, tạo bulk và tạo bulk-array.
2. Endpoint payment instruction gọi `ResolveTuitionReceivingBankUseCase` (hoặc service nghiệp vụ tương đương), lấy mapping grade, configuration và health/mode đã được xác định ở server.
3. Resolver trả account snapshot, `bankSelectionSource`, `confirmationMode` và trạng thái xác nhận. Với dữ liệu mới, use case chỉ dùng intent đã có và tạo `PaymentAttempt` khi cần; với dữ liệu cũ chưa có intent, có thể tạo bù intent `PENDING`, sinh code và VietQR.
4. Response chỉ chứa instruction server đã quyết định, bao gồm `confirmation.status = PENDING_AUTO_CONFIRMATION` hoặc `AWAITING_ADMIN_RECONCILIATION`; không tin bank/amount/code từ FE.
5. Webhook SePay xác thực raw body theo cấu hình SePay, lưu transaction idempotent rồi chỉ auto-match attempt `AUTOMATIC` khi account/code/amount đều đúng và `TuitionPayment` còn `UNPAID`. Đồng bộ `sepayStatus` chỉ áp dụng cho attempt tạo sau đó; không đảo `AUTOMATIC` của attempt đã snapshot thành manual giữa chừng.
6. Trong một Unit of Work khi match hoặc admin đối soát thủ công: transaction `MATCHED` (nếu có), attempt `SUCCEEDED` (nếu có), intent `PAID` và `TuitionPayment` `UNPAID → PAID`. Với manual, mọi giao dịch được chọn phải `UNRECONCILED`, không trùng ID, thuộc một tài khoản nhận hợp lệ và không thuộc attempt tự động/học phí khác; lỗi ở bất kỳ giao dịch nào rollback toàn bộ. Nếu bản ghi học phí cũ chưa có intent, luồng đối soát thủ công tạo bù intent trước khi chuyển trạng thái; không để kết quả `PAID` thiếu intent.
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

| Event                                     | Recipient                            | Khi phát                                                    | Payload tối thiểu                                                                                                                                       | Hành vi FE                                                                  |
| ----------------------------------------- | ------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `tuition-payment:instruction-updated`     | user sở hữu                          | Attempt/QR mới hoặc resolver chuyển qua default manual bank | `eventId`, `occurredAt`, `paymentId`, `attemptId`, `paymentCode`, `confirmationMode`, `confirmationStatus`, `expiresAt`                                 | Tải lại payment instruction một lần; thay QR/nhãn nếu attempt còn hiệu lực. |
| `tuition-payment:status-updated`          | user sở hữu                          | Mọi thay đổi trạng thái có thể hiển thị                     | `eventId`, `occurredAt`, `paymentId`, `attemptId?`, `tuitionStatus`, `attemptStatus?`, `confirmationMode?`, `confirmationStatus?`, `paidAt?`, `version` | Đây là event chuẩn; cập nhật UI hoặc gọi snapshot API nếu version lệch.     |
| `tuition-payment:manual-review-required`  | user sở hữu và admin được phân quyền | Attempt dùng default manual bank hoặc admin cần kiểm tra    | payload chuẩn + `bankSelectionSource = MANUAL_DEFAULT`, `messageKey = AWAITING_ADMIN_RECONCILIATION`                                                    | Client hiển thị chờ sao kê; admin thêm vào hàng đợi đối soát.               |
| `tuition-payment:reconciliation-resolved` | user sở hữu và admin đã thao tác     | Admin xác nhận/từ chối resolution                           | payload chuẩn + `resolution = PAID_CONFIRMED                                                                                                            | REJECTED`, `resolvedBy?`                                                    | Client chỉ hiển thị thành công khi `tuitionStatus = PAID`; admin cập nhật hàng đợi. |
| `tuition-payment:collection-mode-changed` | admin room                           | Mode auto/manual hoặc default bank thay đổi                 | `eventId`, `occurredAt`, `collectionMode`, `defaultManualBankAvailable`, `reason`                                                                       | Hiển thị/đóng banner vận hành, tải lại dashboard.                           |

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
