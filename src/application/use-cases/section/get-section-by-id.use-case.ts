// src/application/use-cases/section/get-section-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ISectionRepository } from '../../../domain/repositories/section.repository'
import { SectionResponseDto } from '../../dtos/section/section.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { SECTION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetSectionByIdUseCase {
  constructor(
    @Inject('ISectionRepository')
    private readonly sectionRepository: ISectionRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) {}

  async execute(sectionId: number, expirySeconds = 3600): Promise<BaseResponseDto<SectionResponseDto>> {
    const section = await this.sectionRepository.findById(sectionId)

    if (!section) {
      throw new NotFoundException('Không tìm thấy phần')
    }

    const sectionResponse = SectionResponseDto.fromEntity(section)

    // Process description with presigned URLs if it exists
    if (sectionResponse.description) {
      const contentFields: ContentField[] = [
        { fieldName: SECTION_CONTENT_FIELDS.DESCRIPTION, content: sectionResponse.description },
      ]

      const processedResults = await this.processContentUseCase.execute(
        contentFields,
        expirySeconds,
      )

      sectionResponse.processedDescription = this.processContentUseCase.getProcessedContent(
        processedResults,
        SECTION_CONTENT_FIELDS.DESCRIPTION,
      ) || sectionResponse.description
    }

    return {
      success: true,
      message: 'Lấy thông tin phần thành công',
      data: sectionResponse,
    }
  }
}
