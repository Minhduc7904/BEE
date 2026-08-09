# StudentFrontend — Mua khóa học qua SePay

1. Gọi API payment instructions, hiển thị đúng `amount`, QR và `transferContent` do backend trả về; không tự tạo mã `KH`.
2. Đợi trạng thái `PAID` từ snapshot API hoặc Socket. Với QR hết hạn, gọi refresh để nhận mã mới; không tái dùng QR cũ.
3. Khi đã `PAID`, xóa QR, dừng countdown và tải lại enrollment trước khi mở nội dung khóa học.

Khi reconnect Socket, luôn lấy snapshot REST trước rồi subscribe lại để bù event bị mất.
