// src/application/use-cases/exam/get-all-exams.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { ExamListQueryDto } from '../../dtos/exam/exam-list-query.dto'
import { ExamListResponseDto, ExamResponseDto } from '../../dtos/exam/exam.dto'

@Injectable()
export class GetAllExamsUseCase {
  constructor(
    @Inject('IExamRepository')
    private readonly examRepository: IExamRepository,
  ) {}

  async execute(query: ExamListQueryDto): Promise<ExamListResponseDto> {
    const filters = {
      subjectId: query.subjectId,
      grade: query.grade,
      visibility: query.visibility,
      createdBy: query.createdBy,
      search: query.search,
    }

    const pagination = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
    }

    const result = await this.examRepository.findAllWithPagination(pagination, filters)

    const examResponses = ExamResponseDto.fromEntities(result.exams)

    return new ExamListResponseDto(examResponses, result.page, result.limit, result.total)
  }
}
