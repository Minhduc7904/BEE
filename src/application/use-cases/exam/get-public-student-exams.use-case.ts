import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import {
    ExamResponseDto,
    PublicStudentExamListQueryDto,
    PublicStudentExamListResponseDto,
} from '../../dtos/exam'
import { ExamVisibility } from '../../../shared/enums'

@Injectable()
export class GetPublicStudentExamsUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
    ) { }

    async execute(query: PublicStudentExamListQueryDto): Promise<PublicStudentExamListResponseDto> {
        const filters = {
            subjectId: query.subjectId,
            grade: query.grade,
            typeOfExam: query.typeOfExam,
            visibility: ExamVisibility.PUBLISHED,
            search: query.search,
        }

        const pagination = {
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
        }

        const result = await this.examRepository.findAllWithPagination(pagination, filters)
        const items = ExamResponseDto.fromEntities(result.exams)

        return PublicStudentExamListResponseDto.fromResult(
            items,
            result.page,
            result.limit,
            result.total,
        )
    }
}
