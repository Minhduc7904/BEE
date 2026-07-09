import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
  ConfirmManualBankTransferPaymentUseCase,
  CreateVnpayQrPaymentUseCase,
  GetAdminOnlineCourseInvoiceDetailUseCase,
  GetAdminOnlineCourseInvoicesUseCase,
  GetOnlineCourseInvoicePaymentStatusUseCase,
  HandleVnpayIpnUseCase,
  VerifyVnpayReturnUseCase,
} from './'

const ONLINE_COURSE_PAYMENT_USE_CASES = [
  CreateVnpayQrPaymentUseCase,
  HandleVnpayIpnUseCase,
  GetOnlineCourseInvoicePaymentStatusUseCase,
  VerifyVnpayReturnUseCase,
  GetAdminOnlineCourseInvoicesUseCase,
  GetAdminOnlineCourseInvoiceDetailUseCase,
  ConfirmManualBankTransferPaymentUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: ONLINE_COURSE_PAYMENT_USE_CASES,
  exports: ONLINE_COURSE_PAYMENT_USE_CASES,
})
export class OnlineCoursePaymentApplicationModule {}
