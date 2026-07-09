# Luong frontend thanh toan khoa hoc online bang VNPay

Tai lieu nay mo ta frontend can lam gi de dung flow:

User bam **Thanh toan** -> backend tao attempt VNPay -> frontend hien QR/payment page -> VNPay goi IPN ve backend -> frontend poll trang thai -> invoice PAID -> nut **Thanh toan** doi thanh **Vao hoc**.

## Nguyen tac quan trong

- Frontend khong duoc tu xac nhan thanh toan thanh cong.
- Return URL chi dung de hien thi trang dang xu ly/ket qua tam thoi.
- Backend chi cap nhat `PAID` va tao `CourseEnrollment` khi VNPay goi IPN hop le va checksum dung.
- Frontend phai poll API `payment-status` sau khi tao thanh toan.
- Khi `status = PAID` va `enrollmentCreated = true`, frontend moi hien nut **Vao hoc**.

## Endpoint can dung

### 1. Tao thanh toan VNPay QR

`POST /api/payments/vnpay/qr`

Can JWT.

Request:

```json
{
  "invoiceId": 123
}
```

Response neu backend/provider co `qrContent`:

```json
{
  "invoiceId": 123,
  "invoiceCode": "INV...",
  "attemptId": 1,
  "attemptCode": "VNPAY_123_...",
  "amount": 299000,
  "currency": "VND",
  "qrContent": "000201...",
  "expiresAt": "2026-07-06T10:30:00.000Z",
  "status": "PENDING"
}
```

Response fallback hien tai:

```json
{
  "invoiceId": 123,
  "invoiceCode": "INV...",
  "attemptId": 1,
  "attemptCode": "VNPAY_123_...",
  "amount": 299000,
  "currency": "VND",
  "paymentUrl": "https://sandbox.vnpayment.vn/...",
  "expiresAt": "2026-07-06T10:30:00.000Z",
  "status": "PENDING"
}
```

Frontend xu ly:

- Neu co `qrContent`: render QR bang thu vien QR cua frontend.
- Neu co `paymentUrl`: redirect user sang `paymentUrl` hoac mo trong tab hien tai.
- Luu `invoiceId`, `attemptCode`, `expiresAt` vao state/local storage de quay lai van poll duoc.
- Bat dau poll `payment-status` moi 2 giay.

### 2. Check trang thai thanh toan

`GET /api/online-course-invoices/:invoiceId/payment-status`

Can JWT.

Response:

```json
{
  "invoiceId": 123,
  "invoiceCode": "INV...",
  "status": "PAID",
  "paidAt": "2026-07-06T10:20:00.000Z",
  "paidAmount": 299000,
  "latestAttempt": {
    "attemptCode": "VNPAY_123_...",
    "status": "SUCCEEDED",
    "provider": "VNPAY"
  },
  "enrollmentCreated": true
}
```

Frontend xu ly theo status:

| Invoice status | Hanh vi frontend |
| --- | --- |
| `PENDING_PAYMENT` | Tiep tuc hien dang cho thanh toan, poll moi 2 giay |
| `PAID` + `enrollmentCreated = true` | Dung poll, hien thanh cong, doi nut thanh **Vao hoc** |
| `PAYMENT_FAILED` | Dung poll, hien thanh toan that bai, cho bam **Thanh toan lai** |
| `EXPIRED` | Dung poll, hien het han, cho tao attempt moi |
| `CANCELLED` | Dung poll, hien hoa don da huy |

### 3. Return URL sau khi user thanh toan

`GET /api/payments/vnpay/return`

Endpoint nay public, frontend co the dung de verify query VNPay redirect ve.

Response:

```json
{
  "isVerified": true,
  "isSuccess": true,
  "txnRef": "VNPAY_123_...",
  "amount": 299000,
  "responseCode": "00",
  "transactionStatus": "00",
  "message": "..."
}
```

Frontend xu ly:

- Khong coi `isSuccess = true` o Return URL la da mua khoa hoc thanh cong.
- Sau Return URL, frontend van phai goi `payment-status`.
- Hien UI dang xu ly: "Dang xac nhan thanh toan..."
- Khi `payment-status.status = PAID` moi hien thanh cong.

## Flow UI de xuat

### Trang chi tiet khoa hoc

Neu user chua mua khoa hoc:

- Hien nut **Thanh toan**.
- Khi user bam:
  - Disable nut.
  - Hien loading "Dang tao thanh toan..."
  - Goi `POST /api/payments/vnpay/qr`.

Neu API tao thanh toan thanh cong:

- Neu co `paymentUrl`: redirect sang VNPay.
- Neu co `qrContent`: hien modal QR.
- Bat dau poll `GET /api/online-course-invoices/:invoiceId/payment-status`.

Neu invoice da PAID:

- Doi nut **Thanh toan** thanh **Vao hoc**.
- Nut **Vao hoc** redirect sang trang hoc cua khoa hoc.

### Trang thanh toan QR

Trang nay nen co:

- Ten khoa hoc/ma hoa don.
- So tien.
- QR/payment instruction.
- Countdown theo `expiresAt`.
- Trang thai: `Dang cho thanh toan`.
- Poll moi 2 giay.

Khi `PAID`:

- Dung countdown.
- Dung polling.
- Hien thong bao thanh cong.
- Hien nut **Vao hoc**.

Khi het han:

- Dung polling.
- Hien "Ma thanh toan da het han".
- Hien nut **Tao ma thanh toan moi**.

## Pseudo code frontend

```ts
async function startVnpayPayment(invoiceId: number) {
  setPaying(true)

  const payment = await api.post('/api/payments/vnpay/qr', { invoiceId })

  savePaymentState({
    invoiceId: payment.invoiceId,
    attemptCode: payment.attemptCode,
    expiresAt: payment.expiresAt,
  })

  startPollingPaymentStatus(payment.invoiceId)

  if (payment.qrContent) {
    openQrModal(payment.qrContent)
    return
  }

  if (payment.paymentUrl) {
    window.location.href = payment.paymentUrl
  }
}

function startPollingPaymentStatus(invoiceId: number) {
  const timer = window.setInterval(async () => {
    const status = await api.get(`/api/online-course-invoices/${invoiceId}/payment-status`)

    if (status.status === 'PAID' && status.enrollmentCreated) {
      window.clearInterval(timer)
      setPaymentSuccess(true)
      setButtonLabel('Vao hoc')
      return
    }

    if (['PAYMENT_FAILED', 'EXPIRED', 'CANCELLED'].includes(status.status)) {
      window.clearInterval(timer)
      setPaymentError(status.status)
    }
  }, 2000)
}
```

## Xu ly Return URL page

Route frontend vi du:

`/payment/vnpay-return`

Khi VNPay redirect ve route nay:

1. Lay query params tren URL.
2. Goi backend `GET /api/payments/vnpay/return` voi cung query params.
3. Neu `isVerified = false`: hien "Khong xac minh duoc giao dich".
4. Neu `isVerified = true`: hien "Dang xac nhan thanh toan...".
5. Lay `invoiceId` tu local storage/payment state truoc do.
6. Poll `GET /api/online-course-invoices/:invoiceId/payment-status`.
7. Chi khi status `PAID` moi hien thanh cong va nut **Vao hoc**.

## Dieu kien de doi nut Thanh toan thanh Vao hoc

Frontend chi doi nut khi mot trong cac dieu kien sau dung:

- API chi tiet khoa hoc tra ve user da co enrollment `ACTIVE`.
- Hoac API `payment-status` tra:
  - `status = PAID`
  - `enrollmentCreated = true`

Khong doi nut dua vao:

- Return URL `vnp_ResponseCode = 00`.
- Frontend tu parse `paymentUrl`.
- User quay lai trang sau khi thanh toan nhung chua poll status.

## Test localhost

Test tao payment URL o localhost:

```env
VNPAY_RETURN_URL=http://localhost:5173/payment/vnpay-return
```

IPN that tu VNPay khong goi duoc localhost. Muon test full flow local can dung tunnel:

```bash
ngrok http 3001
```

Sau do set:

```env
VNPAY_IPN_URL=https://xxx.ngrok-free.app/api/payments/vnpay/ipn
```

Restart backend sau khi doi env.

## Checklist frontend

- [ ] Co nut **Thanh toan** khi user chua mua khoa hoc.
- [ ] Goi `POST /api/payments/vnpay/qr` voi JWT.
- [ ] Redirect sang `paymentUrl` neu response co `paymentUrl`.
- [ ] Render QR neu response co `qrContent`.
- [ ] Poll `GET /api/online-course-invoices/:invoiceId/payment-status` moi 2 giay.
- [ ] Return URL khong tu xac nhan thanh toan, van poll status.
- [ ] Khi `PAID + enrollmentCreated`, hien thanh cong va doi nut thanh **Vao hoc**.
- [ ] Khi failed/expired/cancelled, hien loi va cho thanh toan lai neu business cho phep.
