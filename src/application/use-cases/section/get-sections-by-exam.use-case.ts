// src/application/use-cases/section/get-sections-by-exam.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ISectionRepository } from '../../../domain/repositories/section.repository'
import { SectionResponseDto } from '../../dtos/section/section.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { SECTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetSectionsByExamUseCase {
  constructor(
    @Inject('ISectionRepository')
    private readonly sectionRepository: ISectionRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) {}

  async execute(examId: number, expirySeconds = 3600): Promise<BaseResponseDto<SectionResponseDto[]>> {
    const sections = await this.sectionRepository.findByExamId(examId)
    const sectionDtos = SectionResponseDto.fromEntities(sections)

    // Process description for each section
    for (const dto of sectionDtos) {
      if (dto.description) {
        const contentFields: ContentField[] = [
          { fieldName: SECTION_CONTENT_FIELDS.DESCRIPTION, content: dto.description },
        ]

        const processedResults = await this.processContentUseCase.execute(
          contentFields,
          expirySeconds,
        )

        dto.processedDescription = this.processContentUseCase.getProcessedContent(
          processedResults,
          SECTION_CONTENT_FIELDS.DESCRIPTION,
        ) || dto.description
      }
    }

    return {
      success: true,
      message: 'Lấy danh sách phần thành công',
      data: sectionDtos,
    }
  }
}
