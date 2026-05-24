import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { PublicStudentExamListQueryDto, PublicStudentExamListResponseDto } from '../../dtos/exam'
import { ExamVisibility } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { GetPublicStudentExamsUseCase } from './get-public-student-exams.use-case'

@Injectable()
export class GetPublicSeoRelatedExamsBySlugUseCase {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
    private readonly getPublicStudentExamsUseCase: GetPublicStudentExamsUseCase,
  ) {}

  async execute(slug: string, limit = 10): Promise<PublicStudentExamListResponseDto> {
    const exam = await this.examRepository.findBySlug(slug)

    if (!exam) {
      throw new NotFoundException('Khong tim thay de thi')
    }

    if (exam.visibility !== ExamVisibility.PUBLISHED) {
      throw new ForbiddenException('Chi duoc xem de thi public')
    }

    const query = {
      page: 1,
      limit: Math.max(limit * 2, 20),
      sortBy: 'createdAt',
      sortOrder: 'desc',
      subjectId: exam.subjectId ?? undefined,
      grade: exam.grade ?? undefined,
      typeOfExam: exam.typeOfExam ?? undefined
    } as PublicStudentExamListQueryDto
    

    const response = await this.getPublicStudentExamsUseCase.execute(query, undefined, {
      renderDescriptionHtml: true,
    })

    const relatedItems = (response.data || [])
      .filter((item) => item.examId !== exam.examId)
      .slice(0, limit)

    return PublicStudentExamListResponseDto.fromResult(
      relatedItems,
      1,
      limit,
      relatedItems.length,
    )
  }
}
