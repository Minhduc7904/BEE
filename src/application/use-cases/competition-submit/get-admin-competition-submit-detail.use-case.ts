// src/application/use-cases/competition-submit/get-admin-competition-submit-detail.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories'
import { AdminCompetitionSubmitDetailDto, AdminCompetitionSubmitDetailResponseDto } from '../../dtos/competition-submit/admin-competition-submit-detail.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

/**
 * Admin use case: Lấy chi tiết đầy đủ 1 bài nộp cuộc thi.
 *
 * Trả về:
 * - Thông tin bài nộp (status, điểm, thời gian…)
 * - Thông tin học sinh
 * - Thông tin cuộc thi
 * - Danh sách câu trả lời, mỗi câu kèm:
 *     + Câu hỏi đầy đủ (content, type, correctAnswer, solution)
 *     + Tất cả statements (có isCorrect)
 *     + Kết quả chấm (isCorrect, points)
 */
@Injectable()
export class GetAdminCompetitionSubmitDetailUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    async execute(submitId: number, expirySeconds = 3600): Promise<BaseResponseDto<AdminCompetitionSubmitDetailDto>> {
        const submit = await this.competitionSubmitRepository.findByIdWithFullDetails(submitId)

        if (!submit) {
            throw new NotFoundException(`Bài nộp với ID ${submitId} không tồn tại`)
        }

        const dto = AdminCompetitionSubmitDetailDto.fromEntity(submit)

        // Xử lý presigned URLs cho content, solution và statements của từng câu hỏi
        for (const ansDto of dto.answers) {
            const q = ansDto.question
            if (!q) continue

            const contentFields: ContentField[] = [
                { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: q.content },
            ]

            if (q.solution) {
                contentFields.push({ fieldName: QUESTION_CONTENT_FIELDS.SOLUTION, content: q.solution })
            }

            q.statements.forEach((stmt, index) => {
                contentFields.push({
                    fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                    content: stmt.content,
                })
            })

            const processedResults = await this.processContentUseCase.execute(contentFields, expirySeconds)

            q.processedContent = this.processContentUseCase.getProcessedContent(
                processedResults,
                QUESTION_CONTENT_FIELDS.CONTENT,
            ) || q.content

            if (q.solution) {
                q.processedSolution = this.processContentUseCase.getProcessedContent(
                    processedResults,
                    QUESTION_CONTENT_FIELDS.SOLUTION,
                ) || q.solution
            }

            q.statements.forEach((stmt, index) => {
                stmt.processedContent = this.processContentUseCase.getProcessedContent(
                    processedResults,
                    `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                ) || stmt.content
            })
        }

        return BaseResponseDto.success(
            'Lấy chi tiết bài nộp thành công',
            dto,
        )
    }
}
