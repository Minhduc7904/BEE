import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
  CreatePublicStudentExamAttemptUseCase,
  GetPublicStudentExamAttemptResultUseCase,
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
  StudentExamAttemptResultDto,
} from '../../application/dtos/exam-attempt'

@Injectable()
@Controller('exam-attempts')
export class ExamAttemptController {
  constructor(
    private readonly getPublicStudentExamAttemptsUseCase: GetPublicStudentExamAttemptsUseCase,
    private readonly getPublicStudentExamAttemptDetailUseCase: GetPublicStudentExamAttemptDetailUseCase,
    private readonly getPublicStudentExamAttemptResultUseCase: GetPublicStudentExamAttemptResultUseCase,
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
   * Lấy kết quả bài làm của học sinh cho một lượt làm bài đã nộp.
   * API exam không áp dụng rule ẩn/hiện kết quả như competition.
   *
   * @route GET /exam-attempts/public/student/:attemptId/result
   * @param attemptId - Exam attempt ID
   * @param studentId - Current student ID (auto-injected)
   * @returns BaseResponseDto<StudentExamAttemptResultDto>
   *
   * @example
   * GET /exam-attempts/public/student/10/result
  *
  * Response 200 (ví dụ):
  * {
  *   "success": true,
  *   "message": "Lấy kết quả bài làm thành công",
  *   "data": {
  *     "attemptId": 10,
  *     "examId": 5,
  *     "examTitle": "Đề luyện tập chương 1",
  *     "studentId": 12,
  *     "status": "SUBMITTED",
  *     "startedAt": "2026-03-30T01:00:00.000Z",
  *     "endAt": "2026-03-30T01:45:00.000Z",
  *     "points": 7,
  *     "maxPoints": 10,
  *     "score": 70,
  *     "totalQuestions": 3,
  *     "answeredQuestions": 2,
  *     "correctAnswers": 1,
  *     "incorrectAnswers": 1,
  *     "unansweredQuestions": 1,
  *     "questions": [
  *       {
  *         "questionId": 101,
  *         "content": "2 + 2 = ?",
  *         "type": "SINGLE_CHOICE",
  *         "statements": [
  *           { "statementId": 1001, "content": "3", "isCorrect": false },
  *           { "statementId": 1002, "content": "4", "isCorrect": true }
  *         ],
  *         "answer": {
  *           "questionAnswerId": 501,
  *           "questionId": 101,
  *           "selectedStatementIds": [1002],
  *           "isCorrect": true,
  *           "points": 5,
  *           "maxPoints": 5,
  *           "scorePercentage": 100
  *         }
  *       },
  *       {
  *         "questionId": 102,
  *         "content": "Viết công thức tính chu vi hình tròn",
  *         "type": "SHORT_ANSWER",
  *         "statements": [],
  *         "answer": null
  *       }
  *     ]
  *   }
  * }
   */
  @Get('public/student/:attemptId/result')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getPublicStudentExamAttemptResult(
    @Param('attemptId', ParseIntPipe) attemptId: number,
    @CurrentUser('studentId') studentId: number,
  ): Promise<BaseResponseDto<StudentExamAttemptResultDto>> {
    return ExceptionHandler.execute(() =>
      this.getPublicStudentExamAttemptResultUseCase.execute(attemptId, studentId),
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
