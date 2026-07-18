import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreatePayosPaymentDto } from 'src/application/dtos/online-course-payment'
import { CreatePayosPaymentUseCase, HandlePayosWebhookUseCase } from 'src/application/use-cases/online-course-payment'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('payments/payos')
export class PayosOnlineCoursePaymentController {
  private readonly logger = new Logger(PayosOnlineCoursePaymentController.name)

  constructor(
    private readonly createPayosPaymentUseCase: CreatePayosPaymentUseCase,
    private readonly handlePayosWebhookUseCase: HandlePayosWebhookUseCase,
    private readonly configService: ConfigService,
  ) {}

  /** Creates a PayOS checkout link for the authenticated invoice owner. */
  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async createPayment(@Body() body: CreatePayosPaymentDto, @CurrentUser('userId') userId: number) {
    return ExceptionHandler.execute(() => this.createPayosPaymentUseCase.execute(body.invoiceId, userId))
  }

  /**
   * Public callback registered in the PayOS merchant portal.
   * Invoice status and enrollment are changed only after signature verification here.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: unknown) {
    this.logger.log('[PayOS webhook] request_forwarded_to_handler')
    if (this.configService.get<boolean>('payos.webhookConfirmationOnly')) {
      this.logger.warn('[PayOS webhook] confirmation_only_mode: returning 200 without payment processing')
      return { code: '00', desc: 'Webhook endpoint is active' }
    }

    return this.handlePayosWebhookUseCase.execute(body)
  }
}
