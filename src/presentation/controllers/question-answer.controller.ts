import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common'
import { Injectable } from '@nestjs/common'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { GetPublicStudentQuestionAnswersUseCase } from '../../application/use-cases/question-answer'
import {
    StudentQuestionAnswerListQueryDto,
    StudentQuestionAnswerListResponseDto,
} from '../../application/dtos/question-answer'

@Injectable()
@Controller('question-answers')
export class QuestionAnswerController {
    constructor(
        private readonly getPublicStudentQuestionAnswersUseCase: GetPublicStudentQuestionAnswersUseCase,
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
}
