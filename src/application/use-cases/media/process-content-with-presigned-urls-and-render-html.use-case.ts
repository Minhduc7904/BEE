import { Injectable } from '@nestjs/common'
import {
  ProcessContentWithPresignedUrlsUseCase,
  type ContentField,
  type ProcessedContentField,
} from './process-content-with-presigned-urls.use-case'
import { MarkdownRenderService } from '../../../infrastructure/services/markdown-render.service'

@Injectable()
export class ProcessContentWithPresignedUrlsAndRenderHtmlUseCase {
  constructor(
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    private readonly markdownRenderService: MarkdownRenderService,
  ) {}

  async execute(
    fields: ContentField[],
    expirySeconds = 3600,
  ): Promise<ProcessedContentField[]> {
    const processedFields = await this.processContentUseCase.execute(fields, expirySeconds)

    return processedFields.map((field) => {
      if (!field.processedContent) {
        return field
      }

      return {
        ...field,
        processedContent: this.markdownRenderService.renderToHtml(field.processedContent),
      }
    })
  }

  getProcessedContent(
    results: ProcessedContentField[],
    fieldName: string,
  ): string | null {
    const found = results.find((r) => r.fieldName === fieldName)
    return found?.processedContent ?? null
  }
}