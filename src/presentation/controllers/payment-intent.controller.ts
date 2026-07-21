import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common'

import {
  BaseResponseDto,
  CreatePaymentIntentResponseDto,
  CreatePaymentIntentsByGradePeriodDto,
  CreatePaymentIntentsByGradePeriodResponseDto,
} from '../../application/dtos'
import {
  CreatePaymentIntentForTuitionPaymentUseCase,
  CreatePaymentIntentsByGradePeriodUseCase,
} from '../../application/use-cases/payment-intent'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('admin/payment-intents')
export class PaymentIntentController {
  constructor(
    private readonly createPaymentIntentForTuitionPaymentUseCase: CreatePaymentIntentForTuitionPaymentUseCase,
    private readonly createPaymentIntentsByGradePeriodUseCase: CreatePaymentIntentsByGradePeriodUseCase,
  ) {}

  @Post('tuition-payments/bulk')
  @RequirePermission(PERMISSION_CODES.PAYMENT_INTENT.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createByGradePeriod(
    @Body() dto: CreatePaymentIntentsByGradePeriodDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<CreatePaymentIntentsByGradePeriodResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createPaymentIntentsByGradePeriodUseCase.execute(dto, adminId),
    )
  }

  @Post('tuition-payments/:tuitionPaymentId')
  @RequirePermission(PERMISSION_CODES.PAYMENT_INTENT.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createForTuitionPayment(
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<CreatePaymentIntentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createPaymentIntentForTuitionPaymentUseCase.execute(tuitionPaymentId, adminId),
    )
  }
}
