# Luong frontend thanh toan khoa hoc online bang PayOS

Tai lieu nay la luong PayOS rieng, khong thay doi VNPay hay chuyen khoan thu cong. PayOS tao payment link VietQR; frontend chuyen user den trang checkout PayOS, con backend chi mo khoa hoc khi webhook PayOS hop le da duoc xac minh chu ky.

Tai lieu PayOS tham chieu: [tao payment link](https://payos.vn/docs/api/#tag/payment-request/operation/payment-request), [webhook](https://payos.vn/docs/du-lieu-tra-ve/webhook/) va [kiem tra signature](https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/).

## Nguyen tac bao mat

- `CLIENT_ID_PAYOS`, `API_KEY_PAYOS`, `CHECKSUM_KEY_PAYOS` chi dat o backend; frontend khong duoc nhan hay tu tao `signature`.
- Frontend khong duoc xem query o return URL la bang chung da thanh toan.
- Chi `POST /api/payments/payos/webhook`, sau khi kiem tra HMAC-SHA256 bang `CHECKSUM_KEY_PAYOS`, moi cap nhat invoice `PAID` va tao `CourseEnrollment`.
- Webhook idempotent: callback lap lai cho attempt/invoice da thanh cong se khong tao enrollment trung.

## Cau hinh backend

Ba bien bat buoc da co:

```env
CLIENT_ID_PAYOS=
API_KEY_PAYOS=
CHECKSUM_KEY_PAYOS=
```

Backend dung `APP_URL` lam goc frontend va tu tao hai URL sau:

```env
APP_URL=https://your-frontend-domain.com
# return: https://your-frontend-domain.com/payment/payos-return
# cancel: https://your-frontend-domain.com/payment/payos-cancel
```

Neu hai route khac, set rieng:

```env
PAYOS_RETURN_URL=https://your-frontend-domain.com/payment/payos-return
PAYOS_CANCEL_URL=https://your-frontend-domain.com/payment/payos-cancel
```

Trong cong quan tri PayOS, dang ky webhook public HTTPS:

```text
https://your-api-domain.com/api/payments/payos/webhook
```

PayOS can goi duoc URL nay. Localhost can dung tunnel (vi du ngrok) khi test webhook.

## Endpoint frontend su dung

### 1. Tao payment link

`POST /api/payments/payos`

Can JWT cua nguoi mua.

```json
{
  "invoiceId": 123
}
```

Response:

```json
{
  "invoiceId": 123,
  "invoiceCode": "INV...",
  "attemptId": 7,
  "attemptCode": "PAYOS_123_...",
  "orderCode": 1760000000000,
  "paymentLinkId": "...",
  "amount": 299000,
  "currency": "VND",
  "qrContent": "000201...",
  "paymentUrl": "https://pay.payos.vn/web/...",
  "expiresAt": "2026-07-18T10:30:00.000Z",
  "status": "PENDING"
}
```

Frontend luu `invoiceId`, `attemptCode`, `orderCode`, `expiresAt`, roi redirect ngay trong tab hien tai:

```ts
const payment = await api.post('/api/payments/payos', { invoiceId })
savePaymentState(payment)
window.location.assign(payment.paymentUrl)
```

`qrContent` chi dung neu trang muon hien QR rieng; luong khuyen dung la mo `paymentUrl` cua PayOS.

### 2. Poll trang thai invoice

Dung lai endpoint chung da co, can JWT:

`GET /api/online-course-invoices/:invoiceId/payment-status`

| Trang thai                               | Xu ly frontend                                          |
| ---------------------------------------- | ------------------------------------------------------- |
| `PENDING_PAYMENT`                        | Hien dang cho thanh toan va poll moi 2 giay             |
| `PAID` va `enrollmentCreated = true`     | Dung poll, hien thanh cong va doi nut thanh **Vao hoc** |
| `PAYMENT_FAILED`, `EXPIRED`, `CANCELLED` | Dung poll va hien nut tao lai payment                   |

### 3. Return va cancel page

PayOS redirect trinh duyet ve `returnUrl` khi thanh toan va `cancelUrl` khi user huy. Query co the co `code`, `id`, `cancel`, `status`, `orderCode`.

- `/payment/payos-return`: hien “Dang xac nhan thanh toan...”, lay `invoiceId` tu state/local storage va poll payment status.
- `/payment/payos-cancel`: hien “Ban da huy thanh toan”; khong cap nhat invoice dua tren query va cho user thanh toan lai.
- Du `status=PAID` tren URL, chi hien **Vao hoc** khi API payment status tra `PAID` va `enrollmentCreated=true`.

## Luong end-to-end

1. User bam **Thanh toan bang PayOS**.
2. Frontend goi `POST /api/payments/payos`.
3. Backend kiem tra invoice thuoc user, dang `PENDING_PAYMENT`, co course hop le; ky request bang `CHECKSUM_KEY_PAYOS` va goi PayOS.
4. Backend luu payment attempt provider `PAYOS`, `orderCode`, `paymentLinkId`, URL checkout va QR, sau do tra `paymentUrl`.
5. Frontend redirect user sang checkout PayOS; user quet VietQR/thanh toan.
6. PayOS redirect browser ve return/cancel page va dong thoi POST webhook den backend.
7. Backend xac minh signature, doi chieu `orderCode` va so tien, sau do transactionally danh dau attempt `SUCCEEDED`, invoice `PAID`, va tao/kich hoat enrollment.
8. Frontend poll thay `PAID + enrollmentCreated`, dung poll va hien **Vao hoc**.

## Pseudo code polling

```ts
function startPayosStatusPolling(invoiceId: number) {
  const timer = window.setInterval(async () => {
    const status = await api.get(`/api/online-course-invoices/${invoiceId}/payment-status`)

    if (status.status === 'PAID' && status.enrollmentCreated) {
      window.clearInterval(timer)
      setPaymentSuccess(true)
      return
    }

    if (['PAYMENT_FAILED', 'EXPIRED', 'CANCELLED'].includes(status.status)) {
      window.clearInterval(timer)
      setPaymentError(status.status)
    }
  }, 2000)
}
```

## Checklist deploy

- [ ] Dien ba secret PayOS vao environment cua backend, khong commit secret.
- [ ] Cau hinh `APP_URL`, hoac ca `PAYOS_RETURN_URL` va `PAYOS_CANCEL_URL`.
- [ ] Tao hai route frontend `/payment/payos-return`, `/payment/payos-cancel`.
- [ ] Dang ky va test webhook HTTPS `/api/payments/payos/webhook` trong PayOS.
- [ ] Test thanh toan thanh cong, callback lap lai, sai signature va sai so tien.
- [ ] Xac nhan frontend chi mo khoa hoc khi `PAID + enrollmentCreated`.
