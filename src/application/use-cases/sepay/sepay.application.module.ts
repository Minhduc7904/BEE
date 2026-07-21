import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { NotificationApplicationModule } from '../notification/notification.application.module'
import { TuitionPaymentApplicationModule } from '../tuition-payment/tuition-payment.application.module'
import { SocketModule } from 'src/infrastructure/socket.module'
import { HandleSepayTransactionWebhookUseCase } from './handle-sepay-transaction-webhook.use-case'
import { SepayTransactionSyncService } from './sepay-transaction-sync.service'
import { SepayPaymentConfirmationNotifierService } from './transaction-processing/sepay-payment-confirmation-notifier.service'
import { SepayTransactionProcessorService } from './transaction-processing/sepay-transaction-processor.service'

@Module({
  imports: [InfrastructureModule, NotificationApplicationModule, TuitionPaymentApplicationModule, SocketModule],
  providers: [
    HandleSepayTransactionWebhookUseCase,
    SepayTransactionProcessorService,
    SepayPaymentConfirmationNotifierService,
    SepayTransactionSyncService,
  ],
  exports: [
    HandleSepayTransactionWebhookUseCase,
    SepayTransactionProcessorService,
    SepayPaymentConfirmationNotifierService,
    SepayTransactionSyncService,
  ],
})
export class SepayApplicationModule {}
