import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CreatePayosPaymentDto } from 'src/application/dtos/online-course-payment'
import { CreatePayosPaymentUseCase, HandlePayosWebhookUseCase } from 'src/application/use-cases/online-course-payment'
import { CurrentUser } from 'src/shared/decorators/current-user.decorator'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('payments/payos')
export class PayosOnlineCoursePaymentController {
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
    if (false) {
      return { code: '00', desc: 'Webhook endpoint is active' }
    }

    return this.handlePayosWebhookUseCase.execute(body)
  }
}
