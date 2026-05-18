import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { PublicSeoExamDetailResponseDto } from '../../dtos/exam/exam.dto'
import { ExamVisibility } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'
import { EXAM_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { GetPublicStudentExamContentUseCase } from './get-public-student-exam-content.use-case'

@Injectable()
export class GetPublicStudentExamBySlugUseCase {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
    private readonly getPublicStudentExamContentUseCase: GetPublicStudentExamContentUseCase,
  ) {}

  async execute(
    slug: string,
    _studentId?: number,
    expirySeconds = 3600,
  ): Promise<BaseResponseDto<PublicSeoExamDetailResponseDto>> {
    const exam = await this.examRepository.findBySlug(slug)

    if (!exam) {
      throw new NotFoundException('Khong tim thay de thi')
    }

    if (exam.visibility !== ExamVisibility.PUBLISHED) {
      throw new ForbiddenException('Chi duoc xem chi tiet de thi public')
    }

    const seoDescription = this.buildSeoDescription(exam.title, exam.description)
    const contentFields: ContentField[] = [
      { fieldName: EXAM_CONTENT_FIELDS.DESCRIPTION, content: seoDescription },
    ]
    const processedResults = await this.processContentAndRenderHtmlUseCase.execute(contentFields, expirySeconds)
    const processedDescription =
      this.processContentAndRenderHtmlUseCase.getProcessedContent(
        processedResults,
        EXAM_CONTENT_FIELDS.DESCRIPTION,
      ) || seoDescription

    const examContentResponse = await this.getPublicStudentExamContentUseCase.execute(
      exam.examId,
      undefined,
      expirySeconds,
    )
    const examContent = examContentResponse.data
    if (!examContent) {
      throw new NotFoundException('Khong tim thay noi dung de thi')
    }

    return BaseResponseDto.success('Lay chi tiet de thi public thanh cong', {
      examId: exam.examId,
      title: exam.title,
      subject: exam.subject?.name || null,
      grade: exam.grade ?? null,
      examType: exam.typeOfExam ?? null,
      sections: examContent.sections,
      questions: examContent.questions,
      processedDescription: processedDescription ?? null,
      description: seoDescription,
      solutionYoutubeUrl: exam.solutionYoutubeUrl ?? null
    })
  }

  private buildSeoDescription(title: string, description?: string | null): string {
    const titleText = title?.trim() || 'de thi'
    const introduction = `Beeedu.vn giới thiệu đến quý thầy, cô giáo và các em học sinh ${titleText}. Đề thi có đáp án và hướng dẫn chấm điểm.`
    const excerptLine = `Trích dẫn ${titleText}:`
    const descriptionText = description?.trim()

    return descriptionText
      ? `${introduction}\n\n${excerptLine}\n\n${descriptionText}`
      : `${introduction}\n\n${excerptLine}`
  }

}
