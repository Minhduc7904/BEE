import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
  CreatePublicStudentExamAttemptUseCase,
  GetPublicStudentExamAttemptDetailUseCase,
  GetPublicStudentExamAttemptsUseCase,
  SubmitPublicStudentExamAttemptUseCase,
} from '../../application/use-cases/exam-attempt'
import {
  StartPublicStudentExamAttemptDto,
  StudentExamAttemptDetailResponseDto,
  StudentExamAttemptItemDto,
  StudentExamAttemptListQueryDto,
  StudentExamAttemptListResponseDto,
} from '../../application/dtos/exam-attempt'

@Injectable()
@Controller('exam-attempts')
export class ExamAttemptController {
  constructor(
    private readonly getPublicStudentExamAttemptsUseCase: GetPublicStudentExamAttemptsUseCase,
    private readonly getPublicStudentExamAttemptDetailUseCase: GetPublicStudentExamAttemptDetailUseCase,
    private readonly createPublicStudentExamAttemptUseCase: CreatePublicStudentExamAttemptUseCase,
    private readonly submitPublicStudentExamAttemptUseCase: SubmitPublicStudentExamAttemptUseCase,
  ) { }

  private resolveStudentId(currentStudentId: number, studentId?: string): number {
    if (!studentId) return currentStudentId

    const parsed = Number(studentId)
    if (!Number.isInteger(parsed) || parsed <= 0) return currentStudentId

    return parsed
  }

  /**
   * Get exam attempts of current student from public exams only.
   *
   * @route GET /exam-attempts/public/student
    * @param query - Pagination query (page, limit, sortBy, sortOrder, examId, status)
   * @param studentId - Current student ID (auto-injected)
   * @returns StudentExamAttemptListResponseDto
   *
   * @example
    * GET /exam-attempts/public/student?page=1&limit=10&examId=1
   */
  @Get('public/student')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicStudentExamAttempts(
    @Query() query: StudentExamAttemptListQueryDto,
    @CurrentUser('studentId') studentId: number,
    @Query('studentId') studentIdQuery?: string,
  ): Promise<StudentExamAttemptListResponseDto> {
    const targetStudentId = this.resolveStudentId(studentId, studentIdQuery)

    return ExceptionHandler.execute(() =>
      this.getPublicStudentExamAttemptsUseCase.execute(targetStudentId, query),
    )
  }

  /**
   * Get exam attempt detail of current student from public exams.
   *
   * @route GET /exam-attempts/public/student/:attemptId
   * @param attemptId - Exam attempt ID
   * @param studentId - Current student ID (auto-injected)
   * @returns StudentExamAttemptDetailResponseDto
   *
   * @example
   * GET /exam-attempts/public/student/10
   */
  @Get('public/student/:attemptId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicStudentExamAttemptDetail(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<StudentExamAttemptDetailResponseDto> {
    return ExceptionHandler.execute(() =>
      this.getPublicStudentExamAttemptDetailUseCase.execute(attemptId, studentId),
    )
  }

  /**
   * Check public exam by examId and create exam attempt for current student.
   *
   * @route POST /exam-attempts/public/student/start
    * @param body - examId and optional questionIds to start attempt
   * @param studentId - Current student ID (auto-injected)
   * @returns BaseResponseDto<StudentExamAttemptItemDto>
   *
   * @example
   * POST /exam-attempts/public/student/start
    * Body: { "examId": 1, "questionIds": [11, 12, 13] }
   */
  @Post('public/student/start')
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  async createPublicStudentExamAttempt(
    @Body() body: StartPublicStudentExamAttemptDto,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<StudentExamAttemptItemDto>> {
    return ExceptionHandler.execute(() =>
      this.createPublicStudentExamAttemptUseCase.execute(studentId, body),
    )
  }

  /**
   * Submit current exam attempt and finalize grading.
   * Grading logic is equivalent to finish competition submit flow, excluding homework integration.
   *
   * @route POST /exam-attempts/public/student/:attemptId/submit
   * @param attemptId - Exam attempt ID
   * @param studentId - Current student ID (auto-injected)
   */
  @Post('public/student/:attemptId/submit')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async submitPublicStudentExamAttempt(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() =>
      this.submitPublicStudentExamAttemptUseCase.execute(attemptId, studentId),
    )
  }
}
