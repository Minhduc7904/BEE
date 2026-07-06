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
import { CreateVnpayQrPaymentDto } from 'src/application/dtos/online-course-payment'
import {
    CreateVnpayQrPaymentUseCase,
    GetOnlineCourseInvoicePaymentStatusUseCase,
    HandleVnpayIpnUseCase,
    VerifyVnpayReturnUseCase,
} from 'src/application/use-cases/online-course-payment'
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
    ) { }

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
