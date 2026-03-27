import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { GetPublicStudentExamAttemptsUseCase } from '../../application/use-cases/exam-attempt'
import {
  StudentExamAttemptListQueryDto,
  StudentExamAttemptListResponseDto,
} from '../../application/dtos/exam-attempt'

@Injectable()
@Controller('exam-attempts')
export class ExamAttemptController {
  constructor(
    private readonly getPublicStudentExamAttemptsUseCase: GetPublicStudentExamAttemptsUseCase,
  ) {}

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
   * @param query - Pagination query (page, limit, sortBy, sortOrder)
   * @param studentId - Current student ID (auto-injected)
   * @returns StudentExamAttemptListResponseDto
   *
   * @example
   * GET /exam-attempts/public/student?page=1&limit=10
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
}
