# Tài liệu tham chiếu học phí SePay

## Mã nguồn BEE cần đối chiếu

| Tệp | Dùng để |
| --- | --- |
| `prisma/schema.prisma` — `Student` | Xác nhận `Student.grade` là `Int @db.TinyInt`; dùng làm key mapping, không có bảng Grade riêng. |
| `prisma/schema.prisma` — `TuitionPayment` | Giữ khoản thu là aggregate hiện có, trạng thái `UNPAID`/`PAID` và unique constraint. |
| `src/presentation/controllers/tuition-payment.controller.ts` | API admin/self-service hiện có, permission và thứ tự route. |
| `src/application/use-cases/tuition-payment/update-tuition-payment.use-case.ts` | Luồng kế thừa để admin xác nhận sao kê; đã có audit và notification sau commit. Không mở rộng generic update vô điều kiện. |
| `src/application/use-cases/tuition-payment/` | Create/update/notification hiện có; đặt auto-confirm, resolver và manual resolution thành use case rõ trách nhiệm. |
| `src/domain/repositories/tuition-payment.repository.ts` | Contract học phí; không trộn chi tiết provider/bank vào repository này. |
| `src/domain/repositories/unit-of-work.repository.ts` | Thêm repository payment/receiving account vào Unit of Work khi hiện thực workflow atomic. |
| `src/presentation/gateways/base.gateway.ts` | Xác thực Socket JWT, lưu user vào client data và join room cá nhân `user:{userId}`. |
| `src/presentation/gateways/notification.gateway.ts` | Convention gateway/notification hiện tại; không coi notification chung là trạng thái payment authoritative. |
| `src/infrastructure/services/socket/socket.service.ts` | Phát event tới user/room từ application/infrastructure adapter. |
| `src/application/interface/notification-realtime.service.ts` | Port realtime hiện có; cân nhắc port chuyên biệt cho tuition payment để giữ payload nghiệp vụ rõ ràng. |

`OnlineCourseInvoice` và `OnlineCoursePaymentAttempt` nằm ngoài phạm vi skill này; không đọc/sửa/migrate chúng cho luồng học phí hiện tại.

## Quy ước Socket cần giữ

1. Xác thực Socket bằng JWT trước khi join room. User room hiện có là `user:{userId}`.
2. Không dùng client event `join-room` chung cho room admin hay room theo payment; server phải tự authorize và join room đó dựa trên permission.
3. Phát Socket sau transaction commit. Nếu sau này có outbox, lưu event với `eventId` và phát/retry idempotent.
4. Payload gửi client chỉ gồm thông tin cần hiển thị; số tài khoản đầy đủ, raw payload SePay và secret không đi qua Socket.
5. Socket chỉ push thay đổi. `GET /tuition-payments/my/:id/payment-status` là snapshot recovery khi mở trang/reconnect/thiếu version, không phải API polling định kỳ.

## Tài liệu SePay chính thức

| Chủ đề | Nguồn | Rule áp dụng |
| --- | --- | --- |
| Xác thực webhook | [Xác thực webhook SePay](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc) | Ưu tiên HMAC-SHA256; ký `{timestamp}.{raw_body}`, kiểm tra timestamp/replay và không serialize lại body đã parse. |
| Bảo mật/tích hợp webhook | [Bảo mật webhook SePay](https://developer.sepay.vn/vi/sepay-webhooks/bao-mat) | HTTPS, secret environment, kiểm tra account/amount/code và chống replay. |
| Webhook, retry và idempotency | [Tích hợp Webhook](https://docs.sepay.vn/tich-hop-webhooks.html) | Lưu provider transaction ID unique; endpoint phản hồi nhanh, retry không được tạo paid lặp. |
| VietQR động | [Tạo QR Code VietQR động](https://docs.sepay.vn/tao-qr-code-vietqr-dong.html) | QR dùng account/bank/amount/mã snapshot do BE dựng; `des` là payment code ASCII không dấu. |
| Đối soát | [Đối soát giao dịch](https://developer.sepay.vn/vi/sepay-webhooks/doi-soat-giao-dich) | Bù webhook thiếu bằng cursor/time window qua service idempotent. |

Trước khi code webhook, mở lại đúng trang tài liệu hiện hành và đối chiếu cấu hình SePay thực tế (HMAC, API Key hoặc OAuth). Không giả định một cơ chế xác thực khác với webhook đã được tạo ở dashboard.

## Checklist đọc trước khi hiện thực

1. Default manual bank nào đang `ACTIVE`, ai quản trị và quy tắc thay thế atomic là gì?
2. Grade student lấy tại thời điểm nào; mapping của grade có active không?
3. Configuration hiện đang `AUTOMATIC` hay `MANUAL_FALLBACK`; auto-health được xác định ở đâu?
4. Attempt snapshot account/amount/code/source/mode còn hiệu lực không?
5. User nào sở hữu học phí và guardian nào được nhận Socket event?
6. API nào là self-service, admin hay machine-to-machine; permission nào cần thêm?
7. HMAC/configured authentication, retry, retention/raw payload và privacy có được business owner phê duyệt không?
8. Manual resolution có bắt buộc `MANUAL_BANK_CHECK`, reference, `adminId`, `paidAt` và audit không?
