import { Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  ParentTuitionPaymentCursorQueryDto,
  ParentTuitionPaymentDetailDto,
  ParentTuitionPaymentListItemDto,
  ParentTuitionPaymentStatusSnapshotDto,
} from '../../application/dtos/parent-student-tuition'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CursorPageResponseDto } from '../../application/dtos/pagination/cursor-page-response.dto'
import { PaymentInstructionResponseDto } from '../../application/dtos'
import {
  GetParentStudentTuitionPaymentDetailUseCase,
  GetParentStudentTuitionPaymentInstructionsUseCase,
  GetParentStudentTuitionPaymentsUseCase,
  GetParentStudentTuitionPaymentStatusUseCase,
  ReportParentStudentTuitionTransferredUseCase,
} from '../../application/use-cases/parent-student-tuition'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

/**
 * Học phí của học sinh dành cho phụ huynh. Mọi route kiểm tra liên kết ParentStudent trong use case.
 * Route tĩnh `outstanding-summary` nằm ở ParentStudentDashboardController và phải được đăng ký trước controller
 * này trong PresentationModule (Express 5 không hỗ trợ regex trong tham số route), nếu không `:paymentId` sẽ bắt nó.
 */
@AuthOnly()
@Controller('parent/students/:studentId/tuition-payments')
export class ParentStudentTuitionController {
  constructor(
    private readonly getPayments: GetParentStudentTuitionPaymentsUseCase,
    private readonly getPaymentDetail: GetParentStudentTuitionPaymentDetailUseCase,
    private readonly getPaymentStatus: GetParentStudentTuitionPaymentStatusUseCase,
    private readonly getPaymentInstructions: GetParentStudentTuitionPaymentInstructionsUseCase,
    private readonly reportTransferred: ReportParentStudentTuitionTransferredUseCase,
  ) {}

  @Get()
  getList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: ParentTuitionPaymentCursorQueryDto,
  ): Promise<CursorPageResponseDto<ParentTuitionPaymentListItemDto>> {
    return ExceptionHandler.execute(() => this.getPayments.execute(user, studentId, query))
  }

  @Get(':paymentId')
  getDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<BaseResponseDto<ParentTuitionPaymentDetailDto>> {
    return ExceptionHandler.execute(() => this.getPaymentDetail.execute(user, studentId, paymentId))
  }

  @Get(':paymentId/payment-intent-status')
  getIntentStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<BaseResponseDto<ParentTuitionPaymentStatusSnapshotDto>> {
    return ExceptionHandler.execute(() => this.getPaymentStatus.execute(user, studentId, paymentId))
  }

  @Get(':paymentId/payment-instructions')
  getInstructions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    return ExceptionHandler.execute(() => this.getPaymentInstructions.execute(user, studentId, paymentId))
  }

  @Post(':paymentId/report-transferred')
  @HttpCode(HttpStatus.OK)
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ): Promise<BaseResponseDto<ParentTuitionPaymentStatusSnapshotDto>> {
    return ExceptionHandler.execute(() => this.reportTransferred.execute(user, studentId, paymentId))
  }
}
