# Mẫu Business Rule

## <Tên rule>

- Actor: `<ai thực hiện>`.
- Scope: `<dữ liệu/aggregate actor được phép tác động>`.
- Input tin cậy: `<CurrentUser, DTO, webhook đã verify, scheduler...>`.
- Precondition: `<điều kiện bắt buộc>`.
- Transition/outcome: `<trạng thái trước → sau và dữ liệu tạo/cập nhật>`.
- Rejection: `<điều kiện từ chối và exception/lý do>`.
- Transaction: `<aggregate/repository nào phải atomic>`.
- Audit/notification: `<ai nhận, lúc nào gửi, dữ liệu an toàn>`.
- Retention/xóa: `<lịch sử cần giữ, onDelete hoặc policy xóa>`.

## Ví dụ: xác nhận thanh toán

- Actor: webhook provider đã xác thực hoặc admin có quyền xác nhận thủ công.
- Scope: payment attempt và aggregate sở hữu khoản thu.
- Input tin cậy: raw webhook đã xác thực HMAC hoặc manual DTO có lý do.
- Precondition: transaction chưa xử lý, amount/account/code hợp lệ, khoản thu còn có thể thanh toán.
- Transition/outcome: payment attempt thành công, aggregate được purpose handler chuyển trạng thái.
- Rejection: sai chữ ký, giao dịch trùng, sai tiền, sai mã hoặc aggregate đã hoàn tất.
- Transaction: lưu transaction, idempotency, match và aggregate transition cùng Unit of Work.
- Audit/notification: audit hành động admin; notification sau commit.
- Retention/xóa: không xóa bank transaction khi aggregate bị xóa.
