import {
  IsOptionalEmail,
  IsOptionalString,
  IsRequiredIdNumber,
  IsRequiredString,
} from '../../../shared/decorators/validate'
import {
  BankTransferTransactionType,
  PaymentAttemptStatus,
  PaymentBankSelectionSource,
  PaymentConfirmationMode,
  PaymentIntentStatus,
} from '../../../shared/enums'

export class PublicCoursePaymentCredentialDto {
  @IsOptionalEmail('Email', 120)
  email?: string

  @IsOptionalString('Tên đăng nhập', 100)
  username?: string

  @IsRequiredString('Mật khẩu', 100, 6)
  password: string
}

export class PublicCoursePaymentStatusDto extends PublicCoursePaymentCredentialDto {
  @IsRequiredIdNumber('ID payment intent')
  paymentIntentId: number
}

export class CoursePaymentInstructionResponseDto {
  type: BankTransferTransactionType
  courseId: number
  courseEnrollmentId: number
  paymentIntentId?: number | null
  paymentAttemptId?: number | null
  attemptCode?: string | null
  amount: number
  currency: string
  transferContent?: string | null
  qrCodeUrl?: string | null
  expiresAt?: Date | null
  status: PaymentAttemptStatus | 'FREE' | 'ACTIVE'
  confirmationMode?: PaymentConfirmationMode | null
  bankSelectionSource?: PaymentBankSelectionSource | null
  receivingBankAccount?: {
    receivingBankAccountId: number
    bankCode: string
    accountNumber: string
    accountHolder: string
    displayName?: string | null
  } | null
}

export class CoursePaymentStatusResponseDto {
  type: BankTransferTransactionType
  courseId: number
  courseEnrollmentId: number
  enrollmentStatus: string
  isPaidFull: boolean
  paymentIntentId?: number | null
  paymentIntentStatus?: PaymentIntentStatus | null
  latestPaymentAttemptStatus?: PaymentAttemptStatus | null
}

export class ConfirmManualCoursePaymentDto {
  @IsRequiredIdNumber('ID giao dịch SePay')
  bankTransferTransactionId: number
}
