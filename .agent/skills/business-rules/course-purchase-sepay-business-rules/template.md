# Template kiểm tra rule

| Actor | Action | Điều kiện | Kết quả |
| --- | --- | --- | --- |
| Student | Lấy QR | Sở hữu student, course public | Intent/attempt course hoặc activation free |
| SePay | Webhook | HMAC và exact match | Intent PAID, enrollment ACTIVE |
| Admin | Đối soát tay | Transaction incoming chưa dùng | Audit + activation |
