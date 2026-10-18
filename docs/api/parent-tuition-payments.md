# API học phí dành cho phụ huynh

Tất cả endpoint dùng Bearer JWT của **phụ huynh** (`userType = parent`). Mỗi request kiểm tra liên kết `ParentStudent`
giữa phụ huynh trong token và `studentId` trong đường dẫn; không đủ quyền trả `403`. Hợp đồng chuẩn cho mobile nằm ở
`bee_mobile_app/api/openapi/openapi.yaml` (tag `Parent Tuition`).

Payment core (`TuitionPayment → PaymentIntent → PaymentAttempt`, VietQR, SePay, đối soát) được dùng chung với luồng học sinh
(`docs/api/student-tuition-payment-flow.md`). Mobile **không** tự sinh QR, số tiền, ngân hàng hay nội dung chuyển khoản.

| Method | Path | Mô tả |
| --- | --- | --- |
| GET | `/parent/students/{studentId}/tuition-payments?status=UNPAID\|PAID&after=&limit=` | Danh sách theo cursor. |
| GET | `/parent/students/{studentId}/tuition-payments/{paymentId}` | Chi tiết và lịch sử `PaymentAttempt` (mới nhất trước). |
| GET | `.../{paymentId}/payment-intent-status` | Snapshot REST authoritative; `paymentIntent = null` khi chưa từng mở QR (không 404). |
| GET | `.../{paymentId}/payment-instructions` | Dùng chung use case của học sinh; **có side effect** (tạo intent/attempt). |
| POST | `.../{paymentId}/report-transferred` | Phụ huynh báo đã chuyển khoản; không có body. |

`GET /parent/students/{studentId}/tuition-payments/outstanding-summary` là route tĩnh của Dashboard và phải được đăng ký
trước `:paymentId` trong `PresentationModule`.

## Danh sách và cursor

- Khóa sắp xếp ổn định là `(year, month, paymentId)`. `UNPAID` tăng dần (kỳ cũ nhất trước), `PAID` giảm dần.
- `after` có dạng `{year}_{month}_{paymentId}`; response `meta: { hasNext, nextCursor, limit }`.
- Hạn đóng: `resolveTuitionDueDate` (schema chưa có cột `dueDate` nên là cuối tháng của kỳ, Asia/Ho_Chi_Minh), `isOverdue`
  dùng `isTuitionOverdue` — cùng định nghĩa với `outstanding-summary` của Dashboard.

## Cờ "phụ huynh báo đã chuyển khoản"

`TuitionPayment.payerReportedTransferredAt` và `payerReportedTransferredByUserId` (nullable, `ON DELETE SET NULL`).

- Cờ chỉ là **tín hiệu để trung tâm kiểm tra**, không phải bằng chứng thanh toán và không đổi trạng thái học phí.
- Cờ thuộc khoản học phí (không thuộc QR/attempt) nên không mất khi QR được làm mới.
- Điều kiện báo: khoản còn `UNPAID`, `amount > 0` và đã có ít nhất một `PaymentAttempt`.
- Idempotent: gọi lặp không đổi timestamp. Ghi bằng conditional update nguyên tử
  (`paymentId + status = UNPAID + chưa báo + amount > 0`); nếu khoản đã `PAID` trong lúc thao tác thì không ghi cờ và trả
  snapshot `PAID`.
- Cờ kết thúc khi:
  1. Khoản học phí chuyển `UNPAID → PAID` — mọi đường (SePay tự động, xác nhận thủ công, cập nhật hàng loạt) bắt buộc đi qua
     `ITuitionPaymentRepository.markPaid`, ghi `PAID` và xóa cờ trong cùng một câu lệnh UPDATE. Kiểu
     `UpdateTuitionPaymentData.status` chỉ nhận `UNPAID` nên compiler chặn writer đi vòng.
  2. Số tiền phải đóng (`amount`) của khoản `UNPAID` thay đổi (cập nhật đơn lẻ hoặc hàng loạt), vì lần báo trước đó là cho
     số tiền cũ và các attempt `PENDING` đã bị hết hạn.
- Admin không có thao tác xóa cờ và không có notification/realtime cho thao tác báo chuyển khoản.

## Mã lỗi

| HTTP | Khi nào |
| --- | --- |
| 400 | Query không hợp lệ; chưa mở QR (chưa có attempt); khoản chưa có số tiền hợp lệ. |
| 403 | Token không phải phụ huynh hoặc học sinh không thuộc phụ huynh. |
| 404 | Khoản học phí không thuộc học sinh trong đường dẫn. |
| 422 | Khoản học phí không còn `UNPAID` hoặc payment intent không còn `PENDING`. |
