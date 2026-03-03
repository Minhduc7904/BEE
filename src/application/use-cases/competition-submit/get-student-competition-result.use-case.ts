// src/application/use-cases/competition-submit/get-student-competition-result.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import {
    StudentCompetitionResultDto,
    StudentCompetitionResultResponseDto,
} from '../../dtos/competition-submit/student-competition-result.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    NotFoundException,
    ForbiddenException,
} from '../../../shared/exceptions/custom-exceptions'
import {
    ProcessContentWithPresignedUrlsUseCase,
    type ContentField,
} from '../media/process-content-with-presigned-urls.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

/**
 * Student use case: Lấy kết quả bài nộp cuộc thi của chính học sinh.
 *
 * 3 rules lấy từ cấu hình competition:
 *   Rule 1 – allowViewScore  : trả điểm tổng và điểm từng câu (nếu showResultDetail)
 *   Rule 2 – showResultDetail: trả nội dung câu hỏi + statements + answers
 *   Rule 3 – allowViewAnswer : trả thêm đáp án đúng, lời giải, isCorrect của statement
 */
@Injectable()
export class GetStudentCompetitionResultUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    async execute(
        submitId: number,
        studentId: number,
        expirySeconds = 3600,
    ): Promise<BaseResponseDto<StudentCompetitionResultDto>> {
        // Lấy bài nộp kèm đầy đủ answers, questions, statements, competition
        const submit = await this.competitionSubmitRepository.findByIdWithFullDetails(submitId)

        if (!submit) {
            throw new NotFoundException(`Bài nộp với ID ${submitId} không tồn tại`)
        }

        // Chỉ cho phép học sinh xem bài của chính mình
        if (submit.studentId !== studentId) {
            throw new ForbiddenException('Bạn không có quyền xem bài nộp này')
        }

        const competition = submit.competition
        if (!competition) {
            throw new NotFoundException('Không tìm thấy thông tin cuộc thi của bài nộp')
        }

        const { allowViewScore, showResultDetail, allowViewAnswer, allowViewSolutionYoutubeUrl } =
            competition

        // Không có rule nào được bật → cuộc thi chưa cho xem kết quả
        if (!allowViewScore && !showResultDetail && !allowViewAnswer) {
            throw new ForbiddenException('Cuộc thi chưa cho phép xem kết quả bài nộp')
        }

        // Build DTO theo rules
        const dto = StudentCompetitionResultDto.fromEntity(
            submit,
            allowViewScore,
            showResultDetail,
            allowViewAnswer,
            allowViewSolutionYoutubeUrl,
        )

        // ─── Presigned URLs (chỉ khi showResultDetail) ──────────────────────
        if (showResultDetail && dto.answers) {
            for (const ansDto of dto.answers) {
                const q = ansDto.question
                if (!q) continue

                const contentFields: ContentField[] = [
                    { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: q.content },
                ]

                if (allowViewAnswer && q.solution) {
                    contentFields.push({
                        fieldName: QUESTION_CONTENT_FIELDS.SOLUTION,
                        content: q.solution,
                    })
                }

                q.statements.forEach((stmt, index) => {
                    contentFields.push({
                        fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                        content: stmt.content,
                    })
                })

                const processedResults = await this.processContentUseCase.execute(
                    contentFields,
                    expirySeconds,
                )

                q.processedContent =
                    this.processContentUseCase.getProcessedContent(
                        processedResults,
                        QUESTION_CONTENT_FIELDS.CONTENT,
                    ) || q.content

                if (allowViewAnswer && q.solution) {
                    q.processedSolution =
                        this.processContentUseCase.getProcessedContent(
                            processedResults,
                            QUESTION_CONTENT_FIELDS.SOLUTION,
                        ) || q.solution
                }

                q.statements.forEach((stmt, index) => {
                    stmt.processedContent =
                        this.processContentUseCase.getProcessedContent(
                            processedResults,
                            `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                        ) || stmt.content
                })
            }
        }

        return BaseResponseDto.success('Lấy kết quả bài nộp thành công', dto)
    }
}
