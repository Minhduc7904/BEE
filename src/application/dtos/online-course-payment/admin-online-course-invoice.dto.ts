import { IsDateString, IsObject, IsOptional } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import {
  IsOptionalEnumValue,
  IsOptionalIdNumber,
  IsOptionalNumber,
  IsOptionalString,
} from 'src/shared/decorators/validate'
import { OnlineCourseInvoiceStatus, OnlinePaymentAttemptStatus, OnlinePaymentProvider } from 'src/shared/enums'

export class AdminOnlineCourseInvoiceListQueryDto extends ListQueryDto {
  @IsOptionalEnumValue(OnlineCourseInvoiceStatus, 'Trang thai hoa don')
  status?: OnlineCourseInvoiceStatus

  @IsOptionalEnumValue(OnlinePaymentProvider, 'Nha cung cap thanh toan')
  paymentProvider?: OnlinePaymentProvider

  @IsOptionalIdNumber('ID hoc sinh')
  studentId?: number

  @IsOptionalIdNumber('ID user mua hang')
  buyerUserId?: number

  @IsOptionalString('Ma hoa don', 100)
  invoiceCode?: string

  toPaginationOptions() {
    const page = Math.max(1, this.page || 1)
    const limit = Math.min(1000, Math.max(1, this.limit || 10))
    const allowedSortFields = [
      'invoiceId',
      'invoiceCode',
      'status',
      'subtotalAmount',
      'discountAmount',
      'totalAmount',
      'paidAmount',
      'paymentProvider',
      'createdAt',
      'updatedAt',
      'paidAt',
      'expiresAt',
    ]
    const sortBy = this.sortBy && allowedSortFields.includes(this.sortBy) ? this.sortBy : 'createdAt'
    const sortOrder = this.sortOrder === 'asc' ? 'asc' : 'desc'

    return {
      page,
      limit,
      skip: (page - 1) * limit,
      take: limit,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
    }
  }
}

export class ConfirmManualBankTransferPaymentDto {
  @IsOptionalNumber('So tien da thanh toan', 1)
  paidAmount?: number

  @IsOptional()
  @IsDateString({}, { message: 'Thoi gian thanh toan khong hop le' })
  paidAt?: string

  @IsOptionalString('Ma ngan hang', 50)
  bankCode?: string

  @IsOptionalString('Ma giao dich ngan hang', 100)
  bankTranNo?: string

  @IsOptionalString('Ma giao dich doi soat', 100)
  transactionId?: string

  @IsOptionalString('Ghi chu xac nhan', 1000)
  note?: string

  @IsOptional()
  @IsObject({ message: 'Metadata phai la object' })
  metadata?: Record<string, any>
}

export interface AdminOnlineCourseInvoiceItemResponseDto {
  invoiceItemId: number
  invoiceId: number
  courseId?: number | null
  enrollmentId?: number | null
  courseCode?: string | null
  courseTitle: string
  unitPriceAmount: number
  quantity: number
  discountAmount: number
  totalAmount: number
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface AdminOnlineCoursePaymentAttemptResponseDto {
  attemptId: number
  attemptCode: string
  invoiceId: number
  provider: OnlinePaymentProvider
  status: OnlinePaymentAttemptStatus
  amount: number
  currency: string
  providerOrderId: string
  providerTransactionId?: string | null
  providerResponseCode?: string | null
  providerMessage?: string | null
  providerBankCode?: string | null
  providerBankTranNo?: string | null
  providerCardType?: string | null
  providerPayDate?: string | null
  paidAt?: Date | null
  failedAt?: Date | null
  canceledAt?: Date | null
  expiredAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AdminOnlineCourseInvoiceResponseDto {
  invoiceId: number
  invoiceCode: string
  buyerUserId: number
  studentId: number
  status: OnlineCourseInvoiceStatus
  currency: string
  subtotalAmount: number
  discountAmount: number
  totalAmount: number
  paidAmount: number
  refundedAmount: number
  paymentProvider?: OnlinePaymentProvider | null
  providerOrderId?: string | null
  checkoutUrl?: string | null
  qrCodeUrl?: string | null
  expiresAt?: Date | null
  paidAt?: Date | null
  canceledAt?: Date | null
  refundedAt?: Date | null
  cancelReason?: string | null
  notes?: string | null
  metadata?: any
  items: AdminOnlineCourseInvoiceItemResponseDto[]
  paymentAttempts: AdminOnlineCoursePaymentAttemptResponseDto[]
  latestAttempt?: AdminOnlineCoursePaymentAttemptResponseDto | null
  enrollmentCreated: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ConfirmManualBankTransferPaymentResponseDto {
  invoice: AdminOnlineCourseInvoiceResponseDto
  attempt: AdminOnlineCoursePaymentAttemptResponseDto | null
  alreadyPaid: boolean
  enrollmentCreated: boolean
}
