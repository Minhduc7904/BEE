import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'

import {
  BaseResponseDto,
  CancelPaymentAttemptResponseDto,
  MyTuitionPaymentListResponseDto,
  MyTuitionPaymentResponseDto,
  PaymentInstructionResponseDto,
  SeoParentPaymentAccessQueryDto,
  SeoStudentResponseDto,
  SeoStudentSearchQueryDto,
  SeoTuitionPaymentListQueryDto,
  SeoTuitionPaymentStatsQueryDto,
  TuitionPaymentIntentStatusResponseDto,
  TuitionPaymentMoneyStatsResponseDto,
  TuitionPaymentStatsResponseDto,
} from '../../application/dtos'
import {
  SeoTuitionPaymentAccessService,
  SeoTuitionPaymentService,
} from '../../application/use-cases/seo-tuition-payment'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@Controller('seo/tuition-payments')
export class SeoTuitionPaymentController {
  constructor(
    private readonly seoTuitionPaymentAccessService: SeoTuitionPaymentAccessService,
    private readonly seoTuitionPaymentService: SeoTuitionPaymentService,
  ) {}

  @Get('students')
  @HttpCode(HttpStatus.OK)
  async searchStudents(@Query() query: SeoStudentSearchQueryDto): Promise<BaseResponseDto<SeoStudentResponseDto[]>> {
    return ExceptionHandler.execute(() => this.seoTuitionPaymentAccessService.searchStudents(query.phone))
  }

  @Get('students/:studentId/stats/status')
  @HttpCode(HttpStatus.OK)
  async getStatsByStatus(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: SeoTuitionPaymentStatsQueryDto,
  ): Promise<BaseResponseDto<TuitionPaymentStatsResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.getStatsByStatus(studentId, query.parentPhone, query),
    )
  }

  @Get('students/:studentId/stats/money')
  @HttpCode(HttpStatus.OK)
  async getStatsByMoney(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: SeoTuitionPaymentStatsQueryDto,
  ): Promise<BaseResponseDto<TuitionPaymentMoneyStatsResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.getStatsByMoney(studentId, query.parentPhone, query),
    )
  }

  @Get('students/:studentId/payments/:tuitionPaymentId/payment-intent-status')
  @HttpCode(HttpStatus.OK)
  async getIntentStatus(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Query() query: SeoParentPaymentAccessQueryDto,
  ): Promise<BaseResponseDto<TuitionPaymentIntentStatusResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.getIntentStatus(studentId, query.parentPhone, tuitionPaymentId),
    )
  }

  @Get('students/:studentId/payments/:tuitionPaymentId/payment-instructions')
  @HttpCode(HttpStatus.OK)
  async getPaymentInstructions(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Query() query: SeoParentPaymentAccessQueryDto,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.getPaymentInstructions(studentId, query.parentPhone, tuitionPaymentId),
    )
  }

  @Post('students/:studentId/payments/:tuitionPaymentId/payment-instructions/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshPaymentInstructions(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Query() query: SeoParentPaymentAccessQueryDto,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.refreshPaymentInstructions(studentId, query.parentPhone, tuitionPaymentId),
    )
  }

  @Post('students/:studentId/payments/:tuitionPaymentId/payment-attempts/:paymentAttemptId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelPaymentAttempt(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Param('paymentAttemptId', ParseIntPipe) paymentAttemptId: number,
    @Query() query: SeoParentPaymentAccessQueryDto,
  ): Promise<BaseResponseDto<CancelPaymentAttemptResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.cancelPaymentAttempt(
        studentId,
        query.parentPhone,
        tuitionPaymentId,
        paymentAttemptId,
      ),
    )
  }

  @Get('students/:studentId/payments/:tuitionPaymentId')
  @HttpCode(HttpStatus.OK)
  async getPayment(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('tuitionPaymentId', ParseIntPipe) tuitionPaymentId: number,
    @Query() query: SeoParentPaymentAccessQueryDto,
  ): Promise<BaseResponseDto<MyTuitionPaymentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.getPayment(studentId, query.parentPhone, tuitionPaymentId),
    )
  }

  @Get('students/:studentId')
  @HttpCode(HttpStatus.OK)
  async getPayments(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: SeoTuitionPaymentListQueryDto,
  ): Promise<MyTuitionPaymentListResponseDto> {
    return ExceptionHandler.execute(() =>
      this.seoTuitionPaymentService.getPayments(studentId, query.parentPhone, query),
    )
  }
}
