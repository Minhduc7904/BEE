import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  ParentAttendanceSummaryDto,
  ParentMonthQueryDto,
  ParentOutstandingTuitionSummaryDto,
} from '../../application/dtos/parent-student-dashboard'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import {
  GetParentStudentAttendanceSummaryUseCase,
  GetParentStudentOutstandingTuitionSummaryUseCase,
} from '../../application/use-cases/parent-student-dashboard'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@AuthOnly()
@Controller('parent/students/:studentId')
export class ParentStudentDashboardController {
  constructor(
    private readonly getAttendanceSummary: GetParentStudentAttendanceSummaryUseCase,
    private readonly getOutstandingTuitionSummary: GetParentStudentOutstandingTuitionSummaryUseCase,
  ) {}

  @Get('attendance/statistics')
  getAttendanceStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: ParentMonthQueryDto,
  ): Promise<BaseResponseDto<ParentAttendanceSummaryDto>> {
    return ExceptionHandler.execute(() => this.getAttendanceSummary.execute(user, studentId, query))
  }

  @Get('tuition-payments/outstanding-summary')
  getOutstandingSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<ParentOutstandingTuitionSummaryDto>> {
    return ExceptionHandler.execute(() => this.getOutstandingTuitionSummary.execute(user, studentId))
  }
}
