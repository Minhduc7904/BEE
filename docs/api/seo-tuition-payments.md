# SEO Tuition Payments API

Các API dưới đây phục vụ trang SEO công khai, không dùng Bearer JWT. Quyền truy cập được xác thực bằng cặp `studentId` và `parentPhone` ở mọi API payment; học sinh không có số điện thoại phụ huynh không thể dùng luồng này.

> `parentPhone` nằm trong query string theo yêu cầu contract SEO. FE không được lưu hoặc hiển thị lại số này ngoài phiên thanh toán cần thiết.

## Tìm học sinh

`GET /api/seo/tuition-payments/students?phone=0901234567`

`phone` là số điện thoại phụ huynh hoặc học sinh. API chỉ trả các học sinh có số điện thoại phụ huynh; response không trả `parentPhone`.

```json
{
  "success": true,
  "message": "Tìm thấy học sinh theo số điện thoại",
  "data": [{ "studentId": 12, "fullName": "Nguyễn Văn A", "grade": 7 }]
}
```

## API payment theo học sinh

Tất cả route dưới đây bắt buộc `?parentPhone=<số điện thoại phụ huynh>` và trước khi xử lý đều xác minh số đó đúng với `studentId`.

| Mục đích                | Endpoint                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Danh sách học phí       | `GET /api/seo/tuition-payments/students/:studentId`                                                                       |
| Thống kê trạng thái     | `GET /api/seo/tuition-payments/students/:studentId/stats/status`                                                          |
| Thống kê tiền           | `GET /api/seo/tuition-payments/students/:studentId/stats/money`                                                           |
| Chi tiết học phí        | `GET /api/seo/tuition-payments/students/:studentId/payments/:tuitionPaymentId`                                            |
| Snapshot payment intent | `GET /api/seo/tuition-payments/students/:studentId/payments/:tuitionPaymentId/payment-intent-status`                      |
| Lấy QR/hướng dẫn        | `GET /api/seo/tuition-payments/students/:studentId/payments/:tuitionPaymentId/payment-instructions`                       |
| Tạo QR mới              | `POST /api/seo/tuition-payments/students/:studentId/payments/:tuitionPaymentId/payment-instructions/refresh`              |
| Hủy attempt             | `POST /api/seo/tuition-payments/students/:studentId/payments/:tuitionPaymentId/payment-attempts/:paymentAttemptId/cancel` |

Response, trạng thái payment intent, QR và lifecycle attempt giống luồng student đã đăng nhập. Hướng dẫn tích hợp cho trang công khai xem [SEO tuition payment flow](seo-tuition-payment-flow.md).

Ví dụ:

```http
GET /api/seo/tuition-payments/students/12/payments/201/payment-intent-status?parentPhone=0901234567
```

Nếu cặp `studentId` và `parentPhone` không đúng, hoặc học sinh chưa khai báo số điện thoại phụ huynh, API trả `404` và không tiết lộ student/payment có tồn tại hay không.
