import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  ParentNextScheduleSessionDto,
  ParentScheduleSessionDetailDto,
  ParentScheduleWeekDto,
  ParentScheduleWeekQueryDto,
} from '../../application/dtos/parent-student-schedule'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import {
  GetParentStudentNextScheduleSessionUseCase,
  GetParentStudentScheduleSessionDetailUseCase,
  GetParentStudentScheduleWeekUseCase,
} from '../../application/use-cases/parent-student-schedule'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@AuthOnly()
@Controller('parent/students/:studentId/schedule')
export class ParentStudentScheduleController {
  constructor(
    private readonly getScheduleWeek: GetParentStudentScheduleWeekUseCase,
    private readonly getScheduleSessionDetail: GetParentStudentScheduleSessionDetailUseCase,
    private readonly getNextScheduleSession: GetParentStudentNextScheduleSessionUseCase,
  ) {}

  @Get()
  getWeek(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: ParentScheduleWeekQueryDto,
  ): Promise<BaseResponseDto<ParentScheduleWeekDto>> {
    return ExceptionHandler.execute(() => this.getScheduleWeek.execute(user, studentId, query))
  }

  // Phải khai báo trước ':sessionId' để Nest không parse "next" thành ID.
  @Get('next')
  getNextSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<ParentNextScheduleSessionDto | null>> {
    return ExceptionHandler.execute(() => this.getNextScheduleSession.execute(user, studentId))
  }

  @Get(':sessionId')
  getSessionDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ): Promise<BaseResponseDto<ParentScheduleSessionDetailDto>> {
    return ExceptionHandler.execute(() => this.getScheduleSessionDetail.execute(user, studentId, sessionId))
  }
}
