import { Inject, Injectable } from '@nestjs/common'
import type { IExamAttemptRepository, IExamRepository } from '../../../domain/repositories'
import {
    ExamResponseDto,
    PublicStudentExamAttemptStatus,
    PublicStudentExamListQueryDto,
    PublicStudentExamListResponseDto,
} from '../../dtos/exam'
import { ExamVisibility } from '../../../shared/enums'

@Injectable()
export class GetPublicStudentExamsUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('IExamAttemptRepository')
        private readonly examAttemptRepository: IExamAttemptRepository,
    ) { }

    async execute(
        query: PublicStudentExamListQueryDto,
        studentId?: number,
    ): Promise<PublicStudentExamListResponseDto> {
        const filters = {
            subjectId: query.subjectId,
            grade: query.grade,
            typeOfExam: query.typeOfExam,
            chapterIds: query.chapterIds,
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

        if (studentId && items.length > 0) {
            const examIds = items.map((item) => item.examId)
            const submittedExamIds = await this.examAttemptRepository.findSubmittedExamIdsByStudent(
                studentId,
                examIds,
            )
            const submittedExamIdSet = new Set(submittedExamIds)

            for (const item of items) {
                item.attemptStatus = submittedExamIdSet.has(item.examId)
                    ? PublicStudentExamAttemptStatus.ATTEMPTED
                    : PublicStudentExamAttemptStatus.NOT_ATTEMPTED
            }
        }

        return PublicStudentExamListResponseDto.fromResult(
            items,
            result.page,
            result.limit,
            result.total,
        )
    }
}
