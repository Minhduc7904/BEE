import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  ParentCompetitionSubmissionDetailDto,
  ParentCompetitionSubmissionListItemDto,
  ParentHomeworkSubmissionDetailDto,
  ParentHomeworkSubmissionListItemDto,
  ParentStudentResultCursorQueryDto,
  ParentSubmissionStatisticsDto,
} from '../../application/dtos/parent-student-results'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { CursorPageResponseDto } from '../../application/dtos/pagination/cursor-page-response.dto'
import {
  GetParentStudentCompetitionSubmissionDetailUseCase,
  GetParentStudentCompetitionSubmissionsUseCase,
  GetParentStudentCompetitionStatisticsUseCase,
  GetParentStudentHomeworkSubmissionDetailUseCase,
  GetParentStudentHomeworkSubmissionsUseCase,
  GetParentStudentHomeworkStatisticsUseCase,
} from '../../application/use-cases/parent-student-results'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'

@AuthOnly()
@Controller('parent/students/:studentId/results')
export class ParentStudentResultsController {
  constructor(
    private readonly getHomeworkSubmissions: GetParentStudentHomeworkSubmissionsUseCase,
    private readonly getHomeworkStatistics: GetParentStudentHomeworkStatisticsUseCase,
    private readonly getHomeworkDetail: GetParentStudentHomeworkSubmissionDetailUseCase,
    private readonly getCompetitionSubmissions: GetParentStudentCompetitionSubmissionsUseCase,
    private readonly getCompetitionStatistics: GetParentStudentCompetitionStatisticsUseCase,
    private readonly getCompetitionDetail: GetParentStudentCompetitionSubmissionDetailUseCase,
  ) {}

  @Get('homework-submissions')
  getHomeworkSubmissionList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: ParentStudentResultCursorQueryDto,
  ): Promise<CursorPageResponseDto<ParentHomeworkSubmissionListItemDto>> {
    return ExceptionHandler.execute(() => this.getHomeworkSubmissions.execute(user, studentId, query))
  }

  @Get('homework-submissions/statistics')
  getHomeworkSubmissionStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<ParentSubmissionStatisticsDto>> {
    return ExceptionHandler.execute(() => this.getHomeworkStatistics.execute(user, studentId))
  }

  @Get('homework-submissions/:homeworkSubmitId')
  getHomeworkSubmissionDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('homeworkSubmitId', ParseIntPipe) homeworkSubmitId: number,
  ): Promise<BaseResponseDto<ParentHomeworkSubmissionDetailDto>> {
    return ExceptionHandler.execute(() => this.getHomeworkDetail.execute(user, studentId, homeworkSubmitId))
  }

  @Get('competition-submissions')
  getCompetitionSubmissionList(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query() query: ParentStudentResultCursorQueryDto,
  ): Promise<CursorPageResponseDto<ParentCompetitionSubmissionListItemDto>> {
    return ExceptionHandler.execute(() => this.getCompetitionSubmissions.execute(user, studentId, query))
  }

  @Get('competition-submissions/statistics')
  getCompetitionSubmissionStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
  ): Promise<BaseResponseDto<ParentSubmissionStatisticsDto>> {
    return ExceptionHandler.execute(() => this.getCompetitionStatistics.execute(user, studentId))
  }

  @Get('competition-submissions/:competitionSubmitId')
  getCompetitionSubmissionDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('competitionSubmitId', ParseIntPipe) competitionSubmitId: number,
  ): Promise<BaseResponseDto<ParentCompetitionSubmissionDetailDto>> {
    return ExceptionHandler.execute(() => this.getCompetitionDetail.execute(user, studentId, competitionSubmitId))
  }
}
