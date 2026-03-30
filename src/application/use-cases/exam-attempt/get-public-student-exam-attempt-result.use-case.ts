import { Inject, Injectable } from '@nestjs/common'
import type {
    IExamAttemptRepository,
    IQuestionRepository,
    IQuestionAnswerRepository,
    IStudentRepository,
} from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    ForbiddenException,
    NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import {
    StudentExamAttemptResultDto,
} from '../../dtos/exam-attempt'
import {
    type ContentField,
} from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { ExamAttemptStatus } from '../../../shared/enums/exam-attempt-status.enum'

@Injectable()
export class GetPublicStudentExamAttemptResultUseCase {
    constructor(
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
        @Inject('IQuestionAnswerRepository')
        private readonly questionAnswerRepository: IQuestionAnswerRepository,
        @Inject('IQuestionRepository')
        private readonly questionRepository: IQuestionRepository,
        @Inject('IStudentRepository')
        private readonly studentRepository: IStudentRepository,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    ) { }

    async execute(
        attemptId: number,
        studentId: number,
        expirySeconds = 3600,
    ): Promise<BaseResponseDto<StudentExamAttemptResultDto>> {
        const student = await this.studentRepository.findById(studentId)

        if (!student) {
            throw new NotFoundException('Student profile not found')
        }

        if (!student.user?.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
        }

        const attempt = await this.examAttemptRepository.findPublicByAttemptAndStudent(attemptId, studentId)

        if (!attempt) {
            throw new NotFoundException(`Không tìm thấy lượt làm bài với ID ${attemptId}`)
        }

        if (attempt.status !== ExamAttemptStatus.SUBMITTED) {
            throw new ForbiddenException('Bài thi chưa được nộp nên chưa có kết quả')
        }

        const questionIds = attempt.getQuestionIds()
        const [questions, answers] = await Promise.all([
            this.questionRepository.findByIds(questionIds),
            this.questionAnswerRepository.findPublicByStudentAndAttempt(studentId, attemptId),
        ])

        const questionMap = new Map<number, (typeof questions)[number]>()
        for (const question of questions) {
            questionMap.set(question.questionId, question)
        }

        const orderedQuestions = questionIds
            .map((id) => questionMap.get(id))
            .filter((item): item is NonNullable<typeof item> => Boolean(item))

        const dto = StudentExamAttemptResultDto.fromEntity(attempt, orderedQuestions, answers)

        for (const q of dto.questions) {

            const contentFields: ContentField[] = [
                { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: q.content },
            ]

            if (q.solution) {
                contentFields.push({
                    fieldName: QUESTION_CONTENT_FIELDS.SOLUTION,
                    content: q.solution,
                })
            }

            q.statements.forEach((statement, index) => {
                contentFields.push({
                    fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                    content: statement.content,
                })
            })

            const processedResults = await this.processContentAndRenderHtmlUseCase.execute(
                contentFields,
                expirySeconds,
            )

            q.processedContent =
                this.processContentAndRenderHtmlUseCase.getProcessedContent(
                    processedResults,
                    QUESTION_CONTENT_FIELDS.CONTENT,
                ) || q.content

            if (q.solution) {
                q.processedSolution =
                    this.processContentAndRenderHtmlUseCase.getProcessedContent(
                        processedResults,
                        QUESTION_CONTENT_FIELDS.SOLUTION,
                    ) || q.solution
            }

            q.statements.forEach((statement, index) => {
                statement.processedContent =
                    this.processContentAndRenderHtmlUseCase.getProcessedContent(
                        processedResults,
                        `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                    ) || statement.content
            })
        }

        return BaseResponseDto.success('Lấy kết quả bài làm thành công', dto)
    }
}
