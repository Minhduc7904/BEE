# AdminFrontend — Thanh toán khóa học

1. Chọn một tài khoản nhận đang active qua `PUT /api/admin/course-payment-configuration`.
2. Theo dõi `GET /api/admin/bank-transfer-transactions?type=COURSE_PURCHASE`; bỏ filter để xem giao dịch chưa phân loại cần xử lý thủ công.
3. Chỉ lấy enrollment cần đối soát qua `GET /api/course-enrollments?type=ONLINE_PURCHASE`. Enrollment tạo từ các luồng admin hiện hữu có `type=MANUAL`, không được dùng cho đối soát thanh toán course.
4. Chỉ xác nhận thủ công giao dịch incoming chưa đối soát, đúng tài khoản và đúng số tiền của enrollment `ONLINE_PURCHASE`. Hệ thống ghi audit, gán type `COURSE_PURCHASE` và khóa giao dịch khỏi tái sử dụng.

Tài khoản course có thể dùng chung với học phí, nhưng cấu hình của hai luồng độc lập.
