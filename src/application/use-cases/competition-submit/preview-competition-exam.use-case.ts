// src/application/use-cases/competition-submit/preview-competition-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import { CompetitionExamResponseDto, CompetitionExamQuestionDto } from '../../dtos/competition-submit/competition-exam.dto'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class PreviewCompetitionExamUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    /**
     * Xem trước đề thi của cuộc thi (nếu competition cho phép)
     * Trả về sections, questions, statements KHÔNG có đáp án
     */
    async execute(competitionId: number): Promise<CompetitionExamResponseDto> {
        // 1. Tìm competition
        const competition = await this.competitionRepository.findById(competitionId)

        if (!competition) {
            throw new NotFoundException(`Cuộc thi với ID ${competitionId} không tồn tại`)
        }

        // 2. Kiểm tra competition có cho phép xem trước đề thi không
        if (!competition.allowViewExamContent) {
            throw new ForbiddenException('Cuộc thi này không cho phép xem trước đề thi')
        }

        // 3. Kiểm tra competition có exam không
        if (!competition.examId) {
            throw new NotFoundException('Cuộc thi này không có đề thi')
        }

        // 4. Lấy exam với đầy đủ sections, questions, statements
        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)

        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        // 5. Build response DTO (đã loại bỏ đáp án trong fromExam)
        const response = CompetitionExamResponseDto.fromExam(competition, exam)

        // 6. Thu thập tất cả questions (trong sections và top-level)
        const allQuestions: CompetitionExamQuestionDto[] = [
            ...response.data!.exam.sections.flatMap(s => s.questions),
            ...response.data!.exam.questions,
        ]

        // 7. Xây dựng danh sách content fields để xử lý presigned URLs
        const contentFields: ContentField[] = []

        for (const question of allQuestions) {
            contentFields.push({
                fieldName: `Q${question.questionId}_${QUESTION_CONTENT_FIELDS.CONTENT}`,
                content: question.content,
            })

            if (question.statements) {
                for (const stmt of question.statements) {
                    contentFields.push({
                        fieldName: `Q${question.questionId}_S${stmt.statementId}_CONTENT`,
                        content: stmt.content,
                    })
                }
            }
        }

        // 8. Xử lý toàn bộ presigned URLs trong một lần
        const processedResults = await this.processContentUseCase.execute(contentFields)

        // 9. Gán processedContent về từng question và statement
        for (const question of allQuestions) {
            question.processedContent = this.processContentUseCase.getProcessedContent(
                processedResults,
                `Q${question.questionId}_${QUESTION_CONTENT_FIELDS.CONTENT}`,
            ) || question.content

            if (question.statements) {
                for (const stmt of question.statements) {
                    stmt.processedContent = this.processContentUseCase.getProcessedContent(
                        processedResults,
                        `Q${question.questionId}_S${stmt.statementId}_CONTENT`,
                    ) || stmt.content
                }
            }
        }

        return response
    }
}
