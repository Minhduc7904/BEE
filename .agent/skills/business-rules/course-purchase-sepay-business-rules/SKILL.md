# Business rule mua khóa học qua SePay

Student chỉ tạo hướng dẫn cho course public online của chính mình. Course có phí tạo/reuse enrollment `BLOCKED_UNPAID`, một payment intent type `COURSE_PURCHASE` và payment attempt SePay. Course miễn phí kích hoạt enrollment ngay.

Nội dung hợp lệ là `KH<5 ký tự> CE<enrollmentId> HS<TÊN> <SĐT>`; parser hiện dùng phần định danh bắt buộc `KH/CE`. SePay chỉ auto-confirm giao dịch incoming, mã/reference khớp, đúng account/số tiền, attempt pending/chưa hết hạn và mode automatic. Tất cả transition attempt, intent, transaction và enrollment chạy trong một transaction.

Admin chỉ manual-confirm giao dịch chưa đối soát đúng account/số tiền; lưu audit và không cho tái sử dụng transaction. FE chỉ hiển thị dữ liệu backend trả về, dùng REST snapshot khi reconnect Socket.
