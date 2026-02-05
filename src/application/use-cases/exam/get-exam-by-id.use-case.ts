// src/application/use-cases/exam/get-exam-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ExamResponseDto } from '../../dtos/exam/exam.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { EXAM_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetExamByIdUseCase {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
  ) {}

  async execute(examId: number, expirySeconds = 3600): Promise<BaseResponseDto<ExamResponseDto>> {
    const exam = await this.examRepository.findById(examId)

    if (!exam) {
      throw new NotFoundException('Không tìm thấy đề thi')
    }

    const examResponse = ExamResponseDto.fromEntity(exam)

    // Process description with presigned URLs if it exists
    if (examResponse.description) {
      const contentFields: ContentField[] = [
        { fieldName: EXAM_CONTENT_FIELDS.DESCRIPTION, content: examResponse.description },
      ]

      const processedResults = await this.processContentUseCase.execute(
        contentFields,
        expirySeconds,
      )

      examResponse.processedDescription = this.processContentUseCase.getProcessedContent(
        processedResults,
        EXAM_CONTENT_FIELDS.DESCRIPTION,
      ) || examResponse.description
    }

    return {
      success: true,
      message: 'Lấy thông tin đề thi thành công',
      data: examResponse,
    }
  }
}
