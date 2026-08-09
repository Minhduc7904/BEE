# Luồng SEO course và thanh toán

SEO page lấy chi tiết course như trước. Khi học sinh chọn mua, page gọi `POST /api/courses/public/seo/:courseIdOrCode/payment-instructions` với đúng một `email` hoặc `username` và `password`; course miễn phí được kích hoạt ngay, course có phí nhận QR SePay.

Không còn contract invoice hoặc manual-invoice. Xem [Course payment API](api/course-payments.md) và [Student course payment flow](api/student-course-payment-flow.md).
