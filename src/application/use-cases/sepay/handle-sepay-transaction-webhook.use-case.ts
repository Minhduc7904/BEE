import { Injectable } from '@nestjs/common'
import { SepayService, SepayWebhookHeaders } from 'src/application/interfaces'
import { parseSepayWebhookTransaction } from './transaction-processing/sepay-webhook-transaction-parser.util'
import { SepayPaymentConfirmationNotifierService } from './transaction-processing/sepay-payment-confirmation-notifier.service'
import { SepayTransactionProcessorService } from './transaction-processing/sepay-transaction-processor.service'

@Injectable()
export class HandleSepayTransactionWebhookUseCase {
  constructor(
    private readonly sepayService: SepayService,
    private readonly transactionProcessor: SepayTransactionProcessorService,
    private readonly paymentConfirmationNotifier: SepayPaymentConfirmationNotifierService,
  ) {}

  async execute(rawBody: Buffer, headers: SepayWebhookHeaders, body: unknown): Promise<{ success: true }> {
    this.sepayService.verifyWebhook(rawBody, headers)
    const result = await this.transactionProcessor.process(parseSepayWebhookTransaction(body))
    await this.paymentConfirmationNotifier.notify(result)
    return { success: true }
  }
}
