import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common'

import {
  BaseResponseDto,
  CancelPaymentAttemptResponseDto,
  PaymentInstructionResponseDto,
} from '../../application/dtos'
import {
  CancelMyPaymentAttemptUseCase,
  GetMyTuitionPaymentInstructionsUseCase,
  RefreshMyTuitionPaymentInstructionsUseCase,
} from '../../application/use-cases/payment-attempt'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('tuition-payments/my')
export class PaymentAttemptController {
  constructor(
    private readonly getMyTuitionPaymentInstructionsUseCase: GetMyTuitionPaymentInstructionsUseCase,
    private readonly refreshMyTuitionPaymentInstructionsUseCase: RefreshMyTuitionPaymentInstructionsUseCase,
    private readonly cancelMyPaymentAttemptUseCase: CancelMyPaymentAttemptUseCase,
  ) {}

  @Get(':id/payment-instructions')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPaymentInstructions(
    @Param('id', ParseIntPipe) tuitionPaymentId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getMyTuitionPaymentInstructionsUseCase.execute(tuitionPaymentId, studentId),
    )
  }

  @Post(':id/payment-instructions/refresh')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async refreshPaymentInstructions(
    @Param('id', ParseIntPipe) tuitionPaymentId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.refreshMyTuitionPaymentInstructionsUseCase.execute(tuitionPaymentId, studentId),
    )
  }

  @Post(':tuitionPaymentId/payment-attempts/:paymentAttemptId/cancel')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async cancelPaymentAttempt(
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Param('paymentAttemptId', ParseIntPipe) paymentAttemptId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<CancelPaymentAttemptResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.cancelMyPaymentAttemptUseCase.execute(tuitionPaymentId, paymentAttemptId, studentId),
    )
  }
}
