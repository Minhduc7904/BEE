# Course payment intent — Socket contract

Contract course dùng room riêng `course-payment-intent:{paymentIntentId}` sau khi backend xác minh enrollment thuộc học sinh JWT.

| Event | Hướng | Payload |
| --- | --- | --- |
| `course-payment:intent:subscribe` | FE → BE | `{ paymentIntentId }` |
| `course-payment:intent:status` | BE → FE | snapshot intent/enrollment |
| `course-payment:intent:paid` | BE → FE | snapshot đã thanh toán |
| `course-payment:intent:unsubscribe` | FE → BE | `{ paymentIntentId }` |

Event lỗi dùng envelope chung `{ message, code?, timestamp }`. Không gửi account secret hoặc raw webhook payload qua Socket.
