# Luồng StudentFrontend cho course online

Luồng thanh toán course hiện dùng SePay, không có invoice. StudentFrontend gọi `POST /api/courses/public/seo/:courseIdOrCode/payment-instructions/me`, hiển thị QR và đúng `transferContent` trả về, rồi dùng REST snapshot + Socket.IO để cập nhật trạng thái.

Tài liệu contract đầy đủ: [Student course payment flow](api/student-course-payment-flow.md), [Course payment API](api/course-payments.md), [Socket event](event/course-payment-intent-socket-events.md).
