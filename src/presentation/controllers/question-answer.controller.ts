import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import {
    GetPublicStudentQuestionAnswersByAttemptUseCase,
    GetPublicStudentQuestionAnswersUseCase,
    SubmitPublicStudentQuestionAnswerUseCase,
} from '../../application/use-cases/question-answer'
import {
    StudentQuestionAnswerByAttemptResponseDto,
    StudentQuestionAnswerItemDto,
    StudentQuestionAnswerListQueryDto,
    StudentQuestionAnswerListResponseDto,
    SubmitStudentQuestionAnswerDto,
} from '../../application/dtos/question-answer'

@Injectable()
@Controller('question-answers')
export class QuestionAnswerController {
    constructor(
        private readonly getPublicStudentQuestionAnswersUseCase: GetPublicStudentQuestionAnswersUseCase,
        private readonly getPublicStudentQuestionAnswersByAttemptUseCase: GetPublicStudentQuestionAnswersByAttemptUseCase,
        private readonly submitPublicStudentQuestionAnswerUseCase: SubmitPublicStudentQuestionAnswerUseCase,
    ) { }

    private resolveStudentId(currentStudentId: number, studentId?: string): number {
        if (!studentId) return currentStudentId

        const parsed = Number(studentId)
        if (!Number.isInteger(parsed) || parsed <= 0) return currentStudentId

        return parsed
    }

    /**
     * Get question answers of current student from public exams only.
     *
     * @route GET /question-answers/public/student
     * @param query - Pagination query (page, limit, sortBy, sortOrder)
     * @param studentId - Current student ID (auto-injected)
     * @returns StudentQuestionAnswerListResponseDto
        *
        * Response shape:
        * {
        *   success: true,
        *   message: string,
        *   data: StudentQuestionAnswerItemDto[],
        *   meta: {
        *     page: number,
        *     limit: number,
        *     total: number,
        *     totalPages: number,
        *     hasPrevious: boolean,
        *     hasNext: boolean,
        *     previousPage?: number,
        *     nextPage?: number
        *   }
        * }
     *
     * @example
     * GET /question-answers/public/student?page=1&limit=10
     */
    @Get('public/student')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPublicStudentQuestionAnswers(
        @Query() query: StudentQuestionAnswerListQueryDto,
        @CurrentUser('studentId') studentId: number,
        @Query('studentId') studentIdQuery?: string,
    ): Promise<StudentQuestionAnswerListResponseDto> {
        const targetStudentId = this.resolveStudentId(studentId, studentIdQuery)

        return ExceptionHandler.execute(() =>
            this.getPublicStudentQuestionAnswersUseCase.execute(targetStudentId, query),
        )
    }

    /**
     * Get all question answers by attemptId of current student.
        *
        * @route GET /question-answers/public/student/attempt/:attemptId
        * @param attemptId - Exam attempt ID
        * @param studentId - Current student ID (auto-injected)
        * @returns StudentQuestionAnswerByAttemptResponseDto
        *
        * Response shape:
        * {
        *   success: true,
        *   message: string,
        *   data: {
        *     attemptId: number,
        *     status: 'IN_PROGRESS' | 'SUBMITTED',
        *     questionAnswers: StudentQuestionAnswerItemDto[]
        *   }
        * }
        *
        * Business rule for response fields:
        * - status = IN_PROGRESS: hide `isCorrect`, `points`, `maxPoints` in each item.
        * - status = SUBMITTED: return full scoring fields, including `isCorrect`, `points`, `maxPoints`.
     *
        * @example
        * GET /question-answers/public/student/attempt/12
     */
    @Get('public/student/attempt/:attemptId')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async getPublicStudentQuestionAnswersByAttempt(
        @Param('attemptId', ParseIntPipe) attemptId: number,
        @CurrentUser('studentId') studentId: number,
    ): Promise<StudentQuestionAnswerByAttemptResponseDto> {
        return ExceptionHandler.execute(() =>
            this.getPublicStudentQuestionAnswersByAttemptUseCase.execute(studentId, attemptId),
        )
    }

    /**
     * Upsert student question answer by questionId + attemptId.
     * - If answer not found by (questionId, attemptId): create new one
     * - If found: update and re-grade
     * - If attemptId exists: recalculate attempt scoring fields
     *
     * @route POST /question-answers/public/student/submit
     */
    @Post('public/student/submit')
    @RequirePermission()
    @HttpCode(HttpStatus.OK)
    async submitPublicStudentQuestionAnswer(
        @Body() body: SubmitStudentQuestionAnswerDto,
        @CurrentUser('studentId') studentId: number,
    ): Promise<BaseResponseDto<StudentQuestionAnswerItemDto>> {
        return ExceptionHandler.execute(() =>
            this.submitPublicStudentQuestionAnswerUseCase.execute(studentId, body),
        )
    }
}
