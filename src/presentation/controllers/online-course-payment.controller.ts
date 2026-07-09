import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
} from '@nestjs/common'
import type { Request } from 'express'
import {
    AdminOnlineCourseInvoiceListQueryDto,
    ConfirmManualBankTransferPaymentDto,
    CreateVnpayQrPaymentDto,
} from 'src/application/dtos/online-course-payment'
import {
    ConfirmManualBankTransferPaymentUseCase,
    CreateVnpayQrPaymentUseCase,
    GetAdminOnlineCourseInvoiceDetailUseCase,
    GetAdminOnlineCourseInvoicesUseCase,
    GetOnlineCourseInvoicePaymentStatusUseCase,
    HandleVnpayIpnUseCase,
    VerifyVnpayReturnUseCase,
} from 'src/application/use-cases/online-course-payment'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('payments/vnpay')
export class OnlineCoursePaymentController {
    constructor(
        private readonly createVnpayQrPaymentUseCase: CreateVnpayQrPaymentUseCase,
        private readonly handleVnpayIpnUseCase: HandleVnpayIpnUseCase,
        private readonly verifyVnpayReturnUseCase: VerifyVnpayReturnUseCase,
    ) { }

    /**
     * Endpoint: POST /api/payments/vnpay/qr
     *
     * Request:
     * - Header: Authorization: Bearer <JWT>
     * - Body:
     *   {
     *     "invoiceId": 123
     *   }
     *
     * Response khi VNPay/provider tra duoc QR:
     * {
     *   "invoiceId": 123,
     *   "invoiceCode": "INV...",
     *   "attemptId": 1,
     *   "attemptCode": "VNPAY_123_...",
     *   "amount": 299000,
     *   "currency": "VND",
     *   "qrContent": "000201...",
     *   "expiresAt": "...",
     *   "status": "PENDING"
     * }
     *
     * Response fallback khi chi co payment URL:
     * {
     *   "invoiceId": 123,
     *   "invoiceCode": "INV...",
     *   "attemptId": 1,
     *   "attemptCode": "VNPAY_123_...",
     *   "amount": 299000,
     *   "currency": "VND",
     *   "paymentUrl": "https://sandbox.vnpayment.vn/...",
     *   "expiresAt": "...",
     *   "status": "PENDING"
     * }
     */
    @Post('qr')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async createVnpayQrPayment(
        @Body() body: CreateVnpayQrPaymentDto,
        @CurrentUser('userId') userId: number,
        @Req() req: Request,
    ) {
        return ExceptionHandler.execute(() =>
            this.createVnpayQrPaymentUseCase.execute(body.invoiceId, userId, this.getClientIp(req)),
        )
    }

    /**
     * Endpoint: GET /api/payments/vnpay/ipn
     *
     * Request:
     * - Query: toan bo query params do VNPay gui ve, vi du:
     *   vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_TransactionStatus,
     *   vnp_TransactionNo, vnp_BankCode, vnp_BankTranNo, vnp_CardType,
     *   vnp_PayDate, vnp_SecureHash.
     *
     * Response theo format VNPay:
     * {
     *   "RspCode": "00",
     *   "Message": "Confirm Success"
     * }
     *
     * Luu y:
     * - Endpoint public, khong dung JWT Guard.
     * - Chi endpoint IPN nay duoc cap nhat invoice PAID va tao CourseEnrollment.
     * - Return URL/frontend khong duoc dung de xac nhan thanh toan.
     */
    @Get('ipn')
    @HttpCode(HttpStatus.OK)
    async handleVnpayIpn(@Query() query: Record<string, any>) {
        return this.handleVnpayIpnUseCase.execute(query)
    }

    /**
     * Endpoint: GET /api/payments/vnpay/return
     *
     * Request:
     * - Query: toan bo query params VNPay redirect ve frontend/backend, vi du:
     *   vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_TransactionStatus,
     *   vnp_SecureHash.
     *
     * Response:
     * {
     *   "isVerified": true,
     *   "isSuccess": true,
     *   "txnRef": "VNPAY_123_...",
     *   "amount": 299000,
     *   "responseCode": "00",
     *   "transactionStatus": "00",
     *   "message": "..."
     * }
     *
     * Luu y:
     * - Endpoint nay chi verify/thong bao ket qua Return URL.
     * - Khong update invoice PAID va khong tao CourseEnrollment o endpoint nay.
     */
    @Get('return')
    @HttpCode(HttpStatus.OK)
    async verifyVnpayReturn(@Query() query: Record<string, any>) {
        return ExceptionHandler.execute(async () => this.verifyVnpayReturnUseCase.execute(query))
    }

    private getClientIp(req: Request): string {
        const forwardedFor = req.headers['x-forwarded-for']
        if (typeof forwardedFor === 'string') {
            return forwardedFor.split(',')[0].trim()
        }
        if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
            return forwardedFor[0]
        }
        return req.ip || req.socket.remoteAddress || '127.0.0.1'
    }
}

@Controller('online-course-invoices')
export class OnlineCourseInvoicePaymentStatusController {
    constructor(
        private readonly getOnlineCourseInvoicePaymentStatusUseCase: GetOnlineCourseInvoicePaymentStatusUseCase,
        private readonly getAdminOnlineCourseInvoicesUseCase: GetAdminOnlineCourseInvoicesUseCase,
        private readonly getAdminOnlineCourseInvoiceDetailUseCase: GetAdminOnlineCourseInvoiceDetailUseCase,
        private readonly confirmManualBankTransferPaymentUseCase: ConfirmManualBankTransferPaymentUseCase,
    ) { }

    /**
     * Endpoint: GET /api/online-course-invoices/admin
     *
     * Request:
     * - Header: Authorization: Bearer <JWT admin>
     * - Permission: online-course-invoice:get-all
     * - Query:
     *   page?: number = 1
     *   limit?: number = 10
     *   search?: string
     *   sortBy?: "invoiceId" | "invoiceCode" | "status" | "totalAmount" | "paidAmount" | "paymentProvider" | "createdAt" | "updatedAt" | "paidAt" | "expiresAt"
     *   sortOrder?: "asc" | "desc"
     *   status?: "PENDING_PAYMENT" | "PAID" | "PAYMENT_FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED"
     *   paymentProvider?: "VNPAY" | "BANK_TRANSFER" | "MOMO" | "ZALOPAY" | "PAYOS" | "STRIPE" | "OTHER"
     *   studentId?: number
     *   buyerUserId?: number
     *   invoiceCode?: string
     *   fromDate?: ISO date string
     *   toDate?: ISO date string
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Lay danh sach hoa don mua khoa hoc online thanh cong",
     *   "data": [
     *     {
     *       "invoiceId": 123,
     *       "invoiceCode": "INV...",
     *       "buyerUserId": 10,
     *       "studentId": 5,
     *       "status": "PENDING_PAYMENT",
     *       "currency": "VND",
     *       "subtotalAmount": 299000,
     *       "discountAmount": 0,
     *       "totalAmount": 299000,
     *       "paidAmount": 0,
     *       "paymentProvider": null,
     *       "items": [{ "courseId": 64, "courseTitle": "Khoa hoc online", "enrollmentId": null }],
     *       "paymentAttempts": [],
     *       "latestAttempt": null,
     *       "enrollmentCreated": false
     *     }
     *   ],
     *   "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
     * }
     */
    @Get('admin')
    @RequirePermission(PERMISSION_CODES.ONLINE_COURSE_INVOICE.GET_ALL)
    @HttpCode(HttpStatus.OK)
    async getAdminOnlineCourseInvoices(@Query() query: AdminOnlineCourseInvoiceListQueryDto) {
        return ExceptionHandler.execute(() => this.getAdminOnlineCourseInvoicesUseCase.execute(query))
    }

    /**
     * Endpoint: GET /api/online-course-invoices/admin/:invoiceId
     *
     * Request:
     * - Header: Authorization: Bearer <JWT admin>
     * - Permission: online-course-invoice:get-by-id
     * - Param:
     *   invoiceId: number
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Lay chi tiet hoa don mua khoa hoc online thanh cong",
     *   "data": {
     *     "invoiceId": 123,
     *     "invoiceCode": "INV...",
     *     "buyerUserId": 10,
     *     "studentId": 5,
     *     "status": "PENDING_PAYMENT",
     *     "totalAmount": 299000,
     *     "paidAmount": 0,
     *     "paymentProvider": null,
     *     "items": [{ "invoiceItemId": 1, "courseId": 64, "courseTitle": "Khoa hoc online", "enrollmentId": null }],
     *     "paymentAttempts": [],
     *     "latestAttempt": null,
     *     "enrollmentCreated": false
     *   }
     * }
     */
    @Get('admin/:invoiceId')
    @RequirePermission(PERMISSION_CODES.ONLINE_COURSE_INVOICE.GET_BY_ID)
    @HttpCode(HttpStatus.OK)
    async getAdminOnlineCourseInvoiceDetail(@Param('invoiceId', ParseIntPipe) invoiceId: number) {
        return ExceptionHandler.execute(() => this.getAdminOnlineCourseInvoiceDetailUseCase.execute(invoiceId))
    }

    /**
     * Endpoint: POST /api/online-course-invoices/admin/:invoiceId/confirm-bank-transfer
     *
     * Request:
     * - Header: Authorization: Bearer <JWT admin>
     * - Permission: online-course-invoice:confirm-manual-payment
     * - Param:
     *   invoiceId: number
     * - Body:
     *   {
     *     "paidAmount": 299000,
     *     "paidAt": "2026-07-09T10:00:00.000Z",
     *     "bankCode": "VCB",
     *     "bankTranNo": "FT251234567",
     *     "transactionId": "BANK_TXN_001",
     *     "note": "Admin da doi soat tai khoan ngan hang",
     *     "metadata": { "bankAccount": "0123456789" }
     *   }
     *
     * Response:
     * {
     *   "success": true,
     *   "message": "Xac nhan chuyen khoan va kich hoat khoa hoc thanh cong",
     *   "data": {
     *     "invoice": {
     *       "invoiceId": 123,
     *       "invoiceCode": "INV...",
     *       "status": "PAID",
     *       "paidAmount": 299000,
     *       "paymentProvider": "BANK_TRANSFER",
     *       "items": [{ "courseId": 64, "enrollmentId": 99, "courseTitle": "Khoa hoc online" }],
     *       "enrollmentCreated": true
     *     },
     *     "attempt": {
     *       "attemptCode": "BANK_123_...",
     *       "provider": "BANK_TRANSFER",
     *       "status": "SUCCEEDED",
     *       "amount": 299000
     *     },
     *     "alreadyPaid": false,
     *     "enrollmentCreated": true
     *   }
     * }
     *
     * Luu y:
     * - API nay chi dung cho luong admin kiem tra sao ke ngan hang roi xac nhan thu cong.
     * - Neu invoice da PAID, API khong tao enrollment trung va tra alreadyPaid = true.
     * - paidAmount neu truyen vao phai bang totalAmount cua invoice de mo khoa course.
     */
    @Post('admin/:invoiceId/confirm-bank-transfer')
    @RequirePermission(PERMISSION_CODES.ONLINE_COURSE_INVOICE.CONFIRM_MANUAL_PAYMENT)
    @HttpCode(HttpStatus.OK)
    async confirmManualBankTransferPayment(
        @Param('invoiceId', ParseIntPipe) invoiceId: number,
        @Body() body: ConfirmManualBankTransferPaymentDto,
        @CurrentUser('userId') adminUserId: number,
    ) {
        return ExceptionHandler.execute(() =>
            this.confirmManualBankTransferPaymentUseCase.execute(invoiceId, body, adminUserId),
        )
    }

    /**
     * Endpoint: GET /api/online-course-invoices/:invoiceId/payment-status
     *
     * Request:
     * - Header: Authorization: Bearer <JWT>
     * - Param:
     *   invoiceId: number
     *
     * Response:
     * {
     *   "invoiceId": 123,
     *   "invoiceCode": "INV...",
     *   "status": "PAID",
     *   "paidAt": "...",
     *   "paidAmount": 299000,
     *   "latestAttempt": {
     *     "attemptCode": "VNPAY_123_...",
     *     "status": "SUCCEEDED",
     *     "provider": "VNPAY"
     *   },
     *   "enrollmentCreated": true
     * }
     */
    @Get(':invoiceId/payment-status')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPaymentStatus(
        @Param('invoiceId', ParseIntPipe) invoiceId: number,
        @CurrentUser('userId') userId: number,
    ) {
        return ExceptionHandler.execute(() =>
            this.getOnlineCourseInvoicePaymentStatusUseCase.execute(invoiceId, userId),
        )
    }
}
