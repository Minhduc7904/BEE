// src/application/use-cases/exam/search-exams.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IExamRepository } from '../../../domain/repositories'
import { ExamListQueryDto } from '../../dtos/exam/exam-list-query.dto'
import { ExamListResponseDto, ExamResponseDto } from '../../dtos/exam/exam.dto'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { EXAM_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { ExamVisibility } from '../../../shared/enums'
import { PERMISSION_CODES } from '../../../shared/constants/permissions/permission.codes'

interface SearchContext {
    user?: {
        adminId?: number
        studentId?: number
        permissions?: string[]
    }
}

@Injectable()
export class SearchExamsUseCase {
    constructor(
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    async execute(query: ExamListQueryDto, context?: SearchContext): Promise<ExamListResponseDto> {
        // Apply search filters based on user permissions
        const filters = this.buildFilters(query, context)

        const pagination = {
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
        }

        const result = await this.examRepository.findAllWithPagination(pagination, filters)

        // Filter out DRAFT exams (extra safety layer)
        const nonDraftExams = result.exams.filter(
            exam => exam.visibility !== ExamVisibility.DRAFT
        )

        const examResponses = ExamResponseDto.fromEntities(nonDraftExams)

        return new ExamListResponseDto(
            examResponses,
            result.page,
            result.limit,
            nonDraftExams.length
        )
    }

    private buildFilters(query: ExamListQueryDto, context?: SearchContext): any {
        const filters: any = {
            subjectId: query.subjectId,
            grade: query.grade,
            search: query.search,
        }

        const user = context?.user
        const permissions = user?.permissions ?? []

        // Case 1: No user or student user - only PUBLISHED exams
        if (!user || user.studentId) {
            filters.visibility = ExamVisibility.PUBLISHED
            filters.createdBy = undefined
            return filters
        }

        // Case 2: Admin with GET_ALL permission - PUBLISHED and PRIVATE (exclude DRAFT)
        if (permissions.includes(PERMISSION_CODES.EXAM.GET_ALL)) {
            // No visibility filter here - we'll get all and filter out DRAFT after
            // But we can exclude DRAFT in the query for efficiency
            filters.visibility = undefined
            filters.createdBy = undefined
            filters.excludeVisibility = ExamVisibility.DRAFT
            return filters
        }

        // Case 3: Admin with GET_MY_EXAMS permission - only their PUBLISHED and PRIVATE exams
        if (permissions.includes(PERMISSION_CODES.EXAM.GET_MY_EXAMS)) {
            filters.visibility = undefined
            filters.createdBy = user.adminId
            filters.excludeVisibility = ExamVisibility.DRAFT
            return filters
        }

        // Case 4: Default for other authenticated users - only PUBLISHED
        filters.visibility = ExamVisibility.PUBLISHED
        filters.createdBy = undefined

        return filters
    }
}
