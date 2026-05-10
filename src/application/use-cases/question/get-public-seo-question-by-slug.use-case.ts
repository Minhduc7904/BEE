// src/application/use-cases/question/get-public-seo-question-by-slug.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IQuestionRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { QuestionResponseDto } from '../../dtos/question/question.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { Visibility } from '../../../shared/enums'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { QUESTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetPublicSeoQuestionBySlugUseCase {
    constructor(
        @Inject('IQuestionRepository')
        private readonly questionRepository: IQuestionRepository,
        private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    ) { }

    async execute(slug: string, expirySeconds = 3600): Promise<BaseResponseDto<QuestionResponseDto>> {
        const question = await this.questionRepository.findBySlug(slug)

        if (!question || question.visibility !== Visibility.PUBLISHED) {
            throw new NotFoundException('Không tìm thấy câu hỏi công khai')
        }

        const questionResponse = QuestionResponseDto.fromEntity(question)

        const contentFields: ContentField[] = [
            { fieldName: QUESTION_CONTENT_FIELDS.CONTENT, content: questionResponse.content },
        ]

        if (questionResponse.solution) {
            contentFields.push({ fieldName: QUESTION_CONTENT_FIELDS.SOLUTION, content: questionResponse.solution })
        }

        if (questionResponse.statements) {
            questionResponse.statements.forEach((stmt, index) => {
                contentFields.push({
                    fieldName: `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                    content: stmt.content,
                })
            })
        }

        const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)

        questionResponse.processedContent =
            this.processContentAndRenderHtmlUseCase.getProcessedContent(processedResults, QUESTION_CONTENT_FIELDS.CONTENT) ||
            questionResponse.content

        if (questionResponse.solution) {
            questionResponse.processedSolution =
                this.processContentAndRenderHtmlUseCase.getProcessedContent(processedResults, QUESTION_CONTENT_FIELDS.SOLUTION) ||
                questionResponse.solution
        }

        if (questionResponse.statements) {
            questionResponse.statements.forEach((stmt, index) => {
                stmt.processedContent =
                    this.processContentAndRenderHtmlUseCase.getProcessedContent(
                        processedResults,
                        `${QUESTION_CONTENT_FIELDS.STATEMENT_PREFIX}${index}`,
                    ) || stmt.content
            })
        }

        return BaseResponseDto.success('Lấy thông tin câu hỏi công khai thành công', questionResponse)
    }
}
