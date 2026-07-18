import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import {
  ConfirmManualBankTransferPaymentUseCase,
  CreatePayosPaymentUseCase,
  CreateVnpayQrPaymentUseCase,
  DeleteOnlineCourseInvoiceUseCase,
  GetAdminOnlineCourseInvoiceDetailUseCase,
  GetAdminOnlineCourseInvoicesUseCase,
  GetOnlineCourseInvoicePaymentStatusUseCase,
  HandleVnpayIpnUseCase,
  HandlePayosWebhookUseCase,
  VerifyVnpayReturnUseCase,
} from './'

const ONLINE_COURSE_PAYMENT_USE_CASES = [
  CreatePayosPaymentUseCase,
  CreateVnpayQrPaymentUseCase,
  HandlePayosWebhookUseCase,
  HandleVnpayIpnUseCase,
  GetOnlineCourseInvoicePaymentStatusUseCase,
  VerifyVnpayReturnUseCase,
  GetAdminOnlineCourseInvoicesUseCase,
  GetAdminOnlineCourseInvoiceDetailUseCase,
  ConfirmManualBankTransferPaymentUseCase,
  DeleteOnlineCourseInvoiceUseCase,
]

@Module({
  imports: [InfrastructureModule],
  providers: ONLINE_COURSE_PAYMENT_USE_CASES,
  exports: ONLINE_COURSE_PAYMENT_USE_CASES,
})
export class OnlineCoursePaymentApplicationModule {}
