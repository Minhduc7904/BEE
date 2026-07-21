# Luồng thanh toán học phí của học sinh

Tài liệu này mô tả luồng FE cho trang `/student/payment` và trang/khung thanh toán của một `TuitionPayment`. Mọi REST API yêu cầu Bearer JWT của học sinh; backend luôn xác định học sinh từ JWT, không nhận `studentId` từ client.

- Base URL: `/api`.
- REST snapshot là nguồn sự thật; Socket.IO chỉ đẩy thay đổi sau khi kết nối.
- Chỉ subscribe Socket sau khi REST xác nhận intent hiện tại chưa `PAID`.
- Khi đã `PAID`, dừng mọi lần gọi QR, status và Socket tiếp theo cho intent hiện tại.

Chi tiết contract REST xem [Tuition Payments API](tuition-payments.md) và [Payment Attempts API](payment-attempts.md). Chi tiết payload Socket xem [Tuition payment intent Socket events](../event/tuition-payment-intent-socket-events.md).

## Luồng API

| Trang / điều kiện                                     | API gọi                                                                                                                | Quy tắc FE                                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/student/payment` khi mở trang                       | `GET /api/tuition-payments/my?page=1&limit=20&sortBy=period&sortOrder=desc`                                            | Hiển thị danh sách khoản học phí của học sinh.                                                      |
| `/student/payment` khi đổi trang hoặc bấm **Làm mới** | Gọi lại `GET /api/tuition-payments/my` với `page` hiện tại                                                             | Giữ filter/sort hiện hành nếu UI có dùng.                                                           |
| Layout `/student/payment` khi mount                   | Song song `GET /api/tuition-payments/my/stats/status` và `GET /api/tuition-payments/my/stats/money`                    | Chỉ dùng để hiển thị tổng quan; không thay thế trạng thái của một payment intent.                   |
| Mở thanh toán cho một khoản học phí                   | Song song `GET /api/tuition-payments/my/:paymentId` và `GET /api/tuition-payments/my/:paymentId/payment-intent-status` | Dùng response status làm mốc trước khi quyết định lấy QR hoặc subscribe.                            |
| Status ban đầu là `PAID`                              | Không gọi thêm API                                                                                                     | Không lấy QR, không subscribe Socket; hiển thị trạng thái thanh toán thành công.                    |
| Status ban đầu là `PENDING`                           | `GET /api/tuition-payments/my/:paymentId/payment-instructions`                                                         | Lấy QR/instruction, sau đó theo dõi Socket cho đúng `paymentIntentId`.                              |
| QR hết hạn nhưng chưa thanh toán                      | Gọi lại `GET /api/tuition-payments/my/:paymentId/payment-instructions`                                                 | Backend tái sử dụng QR còn hiệu lực hoặc tạo QR/attempt mới khi QR hết hạn/gần hết hạn.             |
| Bấm **Làm mới** / **Tạo QR mới**                      | `POST /api/tuition-payments/my/:paymentId/payment-instructions/refresh`                                                | Endpoint luôn hết hạn QR cũ và tạo QR/attempt mới; thay QR đang hiển thị bằng response mới.         |
| Bấm **Hủy giao dịch**                                 | `POST /api/tuition-payments/my/:paymentId/payment-attempts/:paymentAttemptId/cancel`                                   | Chỉ hủy attempt `PENDING` của chính payment intent hiện tại; xóa QR đã hủy khỏi UI.                 |
| Socket connect hoặc reconnect khi chưa `PAID`         | `GET /api/tuition-payments/my/:paymentId/payment-intent-status`                                                        | Chỉ subscribe lại nếu REST response vẫn chưa `PAID`; không subscribe chỉ dựa vào state cũ trong FE. |
| Nhận trạng thái `PAID` sau đó                         | Không gọi tiếp QR/status/Socket cho intent hiện tại                                                                    | Xóa QR, dừng countdown và unsubscribe ngay.                                                         |

`paymentId` trong tất cả route trên là `tuitionPaymentId`, không phải `paymentIntentId`. `paymentIntentId` chỉ dùng trong payload Socket để subscribe/unsubscribe.

> Lưu ý về sắp xếp: FE mong muốn gọi `sortBy=period`, nhưng whitelist hiện tại chỉ hỗ trợ `paymentId`, `createdAt`, `updatedAt`, `paidAt`, `status`, `month` và `year`. Vì vậy backend hiện fallback về `createdAt` khi nhận `sortBy=period`. Cần bổ sung `period` vào API nếu muốn backend thực sự sắp xếp theo kỳ học.

## Trình tự mở một payment intent

```mermaid
sequenceDiagram
  participant FE as Student FE
  participant API as REST API
  participant WS as Socket.IO

  FE->>API: GET payment detail + payment-intent-status (parallel)
  API-->>FE: payment + intent status
  alt status is PAID
    FE->>FE: Show paid; do not fetch QR or subscribe
  else status is PENDING
    FE->>API: GET payment-instructions
    API-->>FE: QR/instruction + paymentIntentId
    FE->>WS: intent:subscribe(paymentIntentId)
    WS-->>FE: intent:subscribed + intent:status
    alt status event is PAID
      FE->>WS: intent:unsubscribe(paymentIntentId)
      FE->>FE: Clear QR and show paid
    end
  end
```

## Luồng event payment intent

Trước khi emit `tuition-payment:intent:subscribe`, FE phải đã gọi `GET .../payment-intent-status` và xác nhận intent chưa `PAID`. FE nên đăng ký listener cho `intent:status` và `intent:paid` trước khi emit subscribe để không bỏ lỡ snapshot từ server.

| Chiều           | Event                                 | Rule FE                                                                                                                        |
| --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Client → server | `tuition-payment:intent:subscribe`    | Chỉ emit sau REST status xác nhận chưa `PAID`. Payload: `{ paymentIntentId }`.                                                 |
| Server → client | `tuition-payment:intent:subscribed`   | Server xác nhận đã vào room; frontend hiện không cần xử lý riêng.                                                              |
| Server → client | `tuition-payment:intent:status`       | Cập nhật trạng thái từ payload snapshot. Nếu `tuitionPaymentStatus` hoặc `intentStatus` là `PAID`, xóa QR và unsubscribe ngay. |
| Server → client | `tuition-payment:intent:paid`         | Cập nhật UI thành công, xóa QR, dừng countdown và unsubscribe ngay.                                                            |
| Client → server | `tuition-payment:intent:unsubscribe`  | Emit khi nhận `PAID`, rời trang, đổi intent, hoặc cleanup component sau khi đã subscribe. Payload: `{ paymentIntentId }`.      |
| Server → client | `tuition-payment:intent:unsubscribed` | Server xác nhận đã rời room; frontend hiện không cần xử lý riêng.                                                              |
| Server → client | `error`                               | Hiển thị lỗi phù hợp với `TUITION_PAYMENT_*`, `INVALID_PAYMENT_INTENT_ID` hoặc mã lỗi được trả về.                             |

Socket tự rời room khi disconnect, nhưng FE vẫn phải unsubscribe chủ động khi rời trang hoặc đổi intent để tránh nhận event không còn liên quan trong cùng một kết nối.

## Quy tắc lifecycle FE

1. Mỗi component chỉ giữ tối đa một `paymentIntentId` đang subscribe.
2. Trước khi đổi sang intent khác, unsubscribe intent cũ rồi reset QR, countdown và state Socket cũ.
3. Không polling định kỳ `payment-intent-status`. Chỉ gọi khi mở payment, connect/reconnect, hoặc cần phục hồi sau khi nghi ngờ mất event.
4. QR có `expiresAt`: khi hết hạn và intent chưa `PAID`, gọi `GET payment-instructions`; chỉ dùng `POST .../refresh` khi người dùng chủ động muốn tạo QR mới.
5. Sau `PAID`, state của intent là terminal đối với màn hình hiện tại: không refresh QR, không cancel attempt, không subscribe lại khi reconnect.

## Lỗi FE cần xử lý

| Tình huống                                                              | Hành vi đề xuất                                                                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| REST trả `401`/`403`                                                    | Xử lý phiên đăng nhập hoặc thông báo không có quyền truy cập tuition payment.                                              |
| REST trả `404`                                                          | Thông báo khoản học phí hoặc payment intent không tồn tại; không subscribe Socket.                                         |
| REST trả `422` khi lấy/refresh/hủy QR                                   | Đồng bộ lại bằng `GET .../payment-intent-status`; nếu đã `PAID` thì kết thúc luồng, nếu chưa thì hiển thị message backend. |
| Socket `error` với `INVALID_PAYMENT_INTENT_ID` hoặc `TUITION_PAYMENT_*` | Không retry subscribe mù quáng; gọi lại REST status để đồng bộ trước khi quyết định subscribe lại.                         |
| Socket reconnect                                                        | Gọi lại REST status; chỉ subscribe lại khi status vẫn chưa `PAID`.                                                         |
