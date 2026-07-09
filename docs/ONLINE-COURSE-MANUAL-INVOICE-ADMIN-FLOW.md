# Quan ly hoa don mua khoa hoc online bang chuyen khoan thu cong

Tai lieu nay danh cho trang quan tri khi xu ly truong hop khach hang khong thanh toan tu dong qua VNPay, ma chuyen khoan truc tiep vao tai khoan ngan hang. Admin kiem tra sao ke ngan hang, sau do xac nhan hoa don da thanh toan. Backend se tu dong mark invoice `PAID`, tao payment attempt `BANK_TRANSFER`, va kich hoat `CourseEnrollment`.

## Nguyen tac

- Khong co IPN/checksum nhu VNPay.
- Admin phai dang nhap va co permission quan ly hoa don online course.
- Chi xac nhan thanh toan khi da doi soat tien trong tai khoan ngan hang.
- `paidAmount` phai bang `totalAmount` cua invoice thi backend moi mo khoa course.
- Backend xu ly idempotent: invoice da `PAID` thi khong tao enrollment trung.
- Toan bo thao tac tao attempt, cap nhat invoice, tao/active enrollment nam trong database transaction.

## Permission can co

Sau khi deploy code, chay API sync permission tu `PERMISSION_CODES` de day quyen moi vao DB.

- Xem danh sach hoa don: `online-course-invoice:get-all`
- Xem chi tiet hoa don: `online-course-invoice:get-by-id`
- Xac nhan chuyen khoan: `online-course-invoice:confirm-manual-payment`

## Flow quan tri

1. Khach hang tao invoice mua khoa hoc online va chuyen khoan vao tai khoan ngan hang.
2. Admin vao man hinh quan ly hoa don online course.
3. Frontend goi API danh sach hoa don, loc `status=PENDING_PAYMENT` hoac `PAYMENT_FAILED`.
4. Admin mo chi tiet hoa don, doi chieu `invoiceCode`, `totalAmount`, khoa hoc trong `items`.
5. Admin kiem tra sao ke ngan hang ben ngoai he thong.
6. Neu tien da ve dung, frontend goi API xac nhan chuyen khoan.
7. Backend tao `OnlineCoursePaymentAttempt` provider `BANK_TRANSFER`, status `SUCCEEDED`.
8. Backend cap nhat `OnlineCourseInvoice` thanh `PAID`.
9. Backend tao hoac kich hoat `CourseEnrollment` cho tung item co `courseId`.
10. Trang admin hien invoice da thanh toan, `enrollmentCreated=true`.

## 1. Lay danh sach hoa don

`GET /api/online-course-invoices/admin`

Header:

```http
Authorization: Bearer <admin_jwt>
```

Query:

| Field | Type | Bat buoc | Ghi chu |
| --- | --- | --- | --- |
| page | number | Khong | Mac dinh `1` |
| limit | number | Khong | Mac dinh `10` |
| search | string | Khong | Tim theo invoiceCode, providerOrderId, notes, courseTitle, courseCode |
| sortBy | string | Khong | `invoiceId`, `invoiceCode`, `status`, `totalAmount`, `paidAmount`, `paymentProvider`, `createdAt`, `updatedAt`, `paidAt`, `expiresAt` |
| sortOrder | string | Khong | `asc` hoac `desc` |
| status | string | Khong | `PENDING_PAYMENT`, `PAID`, `PAYMENT_FAILED`, `CANCELLED`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED` |
| paymentProvider | string | Khong | `VNPAY`, `BANK_TRANSFER`, `MOMO`, `ZALOPAY`, `PAYOS`, `STRIPE`, `OTHER` |
| studentId | number | Khong | Loc theo hoc sinh |
| buyerUserId | number | Khong | Loc theo user mua hang |
| invoiceCode | string | Khong | Loc theo ma hoa don |
| fromDate | string | Khong | ISO date |
| toDate | string | Khong | ISO date |

Vi du:

```http
GET /api/online-course-invoices/admin?status=PENDING_PAYMENT&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

Response:

```json
{
  "success": true,
  "message": "Lay danh sach hoa don mua khoa hoc online thanh cong",
  "data": [
    {
      "invoiceId": 123,
      "invoiceCode": "INV_123",
      "buyerUserId": 10,
      "studentId": 5,
      "status": "PENDING_PAYMENT",
      "currency": "VND",
      "subtotalAmount": 299000,
      "discountAmount": 0,
      "totalAmount": 299000,
      "paidAmount": 0,
      "refundedAmount": 0,
      "paymentProvider": null,
      "providerOrderId": null,
      "paidAt": null,
      "items": [
        {
          "invoiceItemId": 1,
          "invoiceId": 123,
          "courseId": 64,
          "enrollmentId": null,
          "courseCode": "ONLINE-64",
          "courseTitle": "Khoa hoc online",
          "unitPriceAmount": 299000,
          "quantity": 1,
          "discountAmount": 0,
          "totalAmount": 299000
        }
      ],
      "paymentAttempts": [],
      "latestAttempt": null,
      "enrollmentCreated": false,
      "createdAt": "2026-07-09T03:00:00.000Z",
      "updatedAt": "2026-07-09T03:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasPrevious": false,
    "hasNext": false
  }
}
```

## 2. Lay chi tiet hoa don

`GET /api/online-course-invoices/admin/:invoiceId`

Header:

```http
Authorization: Bearer <admin_jwt>
```

Param:

| Field | Type | Bat buoc | Ghi chu |
| --- | --- | --- | --- |
| invoiceId | number | Co | ID hoa don |

Vi du:

```http
GET /api/online-course-invoices/admin/123
```

Response:

```json
{
  "success": true,
  "message": "Lay chi tiet hoa don mua khoa hoc online thanh cong",
  "data": {
    "invoiceId": 123,
    "invoiceCode": "INV_123",
    "buyerUserId": 10,
    "studentId": 5,
    "status": "PENDING_PAYMENT",
    "currency": "VND",
    "totalAmount": 299000,
    "paidAmount": 0,
    "paymentProvider": null,
    "items": [
      {
        "invoiceItemId": 1,
        "courseId": 64,
        "courseTitle": "Khoa hoc online",
        "enrollmentId": null,
        "totalAmount": 299000
      }
    ],
    "paymentAttempts": [],
    "latestAttempt": null,
    "enrollmentCreated": false
  }
}
```

## 3. Xac nhan chuyen khoan thu cong

`POST /api/online-course-invoices/admin/:invoiceId/confirm-bank-transfer`

Header:

```http
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

Param:

| Field | Type | Bat buoc | Ghi chu |
| --- | --- | --- | --- |
| invoiceId | number | Co | ID hoa don can xac nhan |

Body:

| Field | Type | Bat buoc | Ghi chu |
| --- | --- | --- | --- |
| paidAmount | number | Khong | Neu khong truyen se lay `invoice.totalAmount`; neu truyen phai bang `totalAmount` |
| paidAt | string | Khong | ISO datetime; neu khong truyen backend dung thoi gian hien tai |
| bankCode | string | Khong | Ma ngan hang, vi du `VCB`, `TCB` |
| bankTranNo | string | Khong | Ma giao dich ngan hang tren sao ke |
| transactionId | string | Khong | Ma giao dich noi bo/doi soat neu admin co |
| note | string | Khong | Ghi chu xac nhan |
| metadata | object | Khong | Thong tin bo sung cho doi soat |

Request:

```json
{
  "paidAmount": 299000,
  "paidAt": "2026-07-09T10:00:00.000Z",
  "bankCode": "VCB",
  "bankTranNo": "FT251234567",
  "transactionId": "BANK_TXN_001",
  "note": "Admin da doi soat sao ke ngan hang",
  "metadata": {
    "bankAccount": "0123456789",
    "statementLine": "INV_123 Nguyen Van A"
  }
}
```

Response thanh cong lan dau:

```json
{
  "success": true,
  "message": "Xac nhan chuyen khoan va kich hoat khoa hoc thanh cong",
  "data": {
    "invoice": {
      "invoiceId": 123,
      "invoiceCode": "INV_123",
      "buyerUserId": 10,
      "studentId": 5,
      "status": "PAID",
      "currency": "VND",
      "totalAmount": 299000,
      "paidAmount": 299000,
      "paymentProvider": "BANK_TRANSFER",
      "providerOrderId": "BANK_123_1783594800000",
      "paidAt": "2026-07-09T10:00:00.000Z",
      "items": [
        {
          "invoiceItemId": 1,
          "courseId": 64,
          "courseTitle": "Khoa hoc online",
          "enrollmentId": 99,
          "totalAmount": 299000
        }
      ],
      "latestAttempt": {
        "attemptId": 7,
        "attemptCode": "BANK_123_1783594800000",
        "provider": "BANK_TRANSFER",
        "status": "SUCCEEDED",
        "amount": 299000,
        "currency": "VND",
        "providerOrderId": "BANK_123_1783594800000",
        "providerTransactionId": "BANK_TXN_001",
        "providerBankCode": "VCB",
        "providerBankTranNo": "FT251234567"
      },
      "enrollmentCreated": true
    },
    "attempt": {
      "attemptId": 7,
      "attemptCode": "BANK_123_1783594800000",
      "provider": "BANK_TRANSFER",
      "status": "SUCCEEDED",
      "amount": 299000,
      "currency": "VND"
    },
    "alreadyPaid": false,
    "enrollmentCreated": true
  }
}
```

Response neu invoice da `PAID` va admin bam lai:

```json
{
  "success": true,
  "message": "Xac nhan chuyen khoan va kich hoat khoa hoc thanh cong",
  "data": {
    "invoice": {
      "invoiceId": 123,
      "status": "PAID",
      "paymentProvider": "BANK_TRANSFER",
      "enrollmentCreated": true
    },
    "attempt": {
      "attemptCode": "BANK_123_1783594800000",
      "provider": "BANK_TRANSFER",
      "status": "SUCCEEDED"
    },
    "alreadyPaid": true,
    "enrollmentCreated": true
  }
}
```

## Trang quan tri nen hien thi

- Bang danh sach hoa don:
  - `invoiceCode`
  - `studentId`
  - `buyerUserId`
  - `status`
  - `totalAmount`
  - `paidAmount`
  - `paymentProvider`
  - `createdAt`
  - `paidAt`
  - so khoa hoc trong `items`
  - `enrollmentCreated`
- Bo loc nhanh:
  - `status=PENDING_PAYMENT`
  - `status=PAYMENT_FAILED`
  - `paymentProvider=BANK_TRANSFER`
  - `invoiceCode`
  - `search`
  - khoang ngay `fromDate/toDate`
- Trang chi tiet:
  - thong tin invoice
  - danh sach course trong `items`
  - lich su `paymentAttempts`
  - trang thai enrollment da tao hay chua
- Nut hanh dong:
  - Chi hien nut **Xac nhan chuyen khoan** khi invoice `PENDING_PAYMENT` hoac `PAYMENT_FAILED`.
  - Khi invoice `PAID`, hien badge **Da thanh toan** va an nut xac nhan.

## Loi thuong gap

- `404`: Khong tim thay hoa don.
- `400 Hoa don khong co khoa hoc hop le de kich hoat`: invoice khong co item nao co `courseId`.
- `400 Tong tien hoa don phai lon hon 0`: invoice khong hop le de thu tien.
- `400 So tien da thanh toan phai bang tong tien hoa don`: admin nhap so tien khac `totalAmount`.
- `400 Khong the xac nhan thanh toan cho hoa don co trang thai ...`: invoice dang `CANCELLED`, `EXPIRED`, `REFUNDED` hoac trang thai khong cho xac nhan.
