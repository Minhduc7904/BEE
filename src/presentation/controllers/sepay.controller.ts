import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import type { Request } from 'express'
import { HandleSepayTransactionWebhookUseCase } from 'src/application/use-cases/sepay'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('webhooks/sepay')
export class SepayController {
  constructor(
    private readonly handleSepayTransactionWebhookUseCase: HandleSepayTransactionWebhookUseCase,
  ) {}

  /** Public provider callback. HMAC verification is performed by the use case. */
  @Post('transactions')
  @HttpCode(HttpStatus.OK)
  async handleTransaction(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-sepay-signature') signature: string | undefined,
    @Headers('x-sepay-timestamp') timestamp: string | undefined,
    @Body() body: unknown,
  ): Promise<{ success: true }> {
    return ExceptionHandler.execute(() => {
      if (!request.rawBody) {
        throw new Error('Không thể đọc raw body của webhook SePay')
      }

      return this.handleSepayTransactionWebhookUseCase.execute(
        request.rawBody,
        { signature, timestamp },
        body,
      )
    })
  }
}
