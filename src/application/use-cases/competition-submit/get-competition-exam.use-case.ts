// src/application/use-cases/competition-submit/get-competition-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, IExamRepository } from '../../../domain/repositories'
import { CompetitionExamResponseDto, CompetitionExamQuestionDto, CompetitionExamStatementDto } from '../../dtos/competition-submit/competition-exam.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetCompetitionExamUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    async execute(competitionId: number): Promise<CompetitionExamResponseDto> {
        // 1. Tìm competition
        const competition = await this.competitionRepository.findById(competitionId)

        if (!competition) {
            throw new NotFoundException(`Cuộc thi với ID ${competitionId} không tồn tại`)
        }

        // 2. Kiểm tra competition có exam không
        if (!competition.examId) {
            throw new NotFoundException('Cuộc thi này không có đề thi')
        }

        // 3. Lấy exam với đầy đủ sections, questions, statements
        const exam = await this.examRepository.findByIdWithFullDetails(competition.examId)

        if (!exam) {
            throw new NotFoundException('Không tìm thấy đề thi')
        }

        // 4. Build response DTO
        const response = CompetitionExamResponseDto.fromExam(competition, exam)

        // 5. Thu thập tất cả questions (trong sections và top-level)
        const allQuestions: CompetitionExamQuestionDto[] = [
            ...response.data!.exam.sections.flatMap(s => s.questions),
            ...response.data!.exam.questions,
        ]

        // 6. Xây dựng danh sách content fields để xử lý presigned URLs
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

        // 7. Xử lý toàn bộ presigned URLs trong một lần
        const processedResults = await this.processContentUseCase.execute(contentFields)

        // 8. Gán processedContent về từng question và statement
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
