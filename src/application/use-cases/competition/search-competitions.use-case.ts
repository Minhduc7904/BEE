// src/application/use-cases/competition/search-competitions.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories'
import { CompetitionListQueryDto } from '../../dtos/competition/competition-list-query.dto'
import { CompetitionListResponseDto, CompetitionResponseDto } from '../../dtos/competition/competition.dto'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { COMPETITION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'
import { Visibility } from '../../../shared/enums'
import { PERMISSION_CODES } from '../../../shared/constants/permissions/permission.codes'

interface SearchContext {
    user?: {
        adminId?: number
        studentId?: number
        permissions?: string[]
    }
}

@Injectable()
export class SearchCompetitionsUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    async execute(query: CompetitionListQueryDto, context?: SearchContext): Promise<CompetitionListResponseDto> {
        // Apply search filters based on user permissions
        const filters = this.buildFilters(query, context)

        const pagination = {
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
        }

        const result = await this.competitionRepository.findAllWithPagination(pagination, filters)

        // Filter out DRAFT competitions (extra safety layer)
        const nonDraftCompetitions = result.competitions.filter(
            competition => competition.visibility !== Visibility.DRAFT
        )

        const competitionResponses = CompetitionResponseDto.fromEntities(nonDraftCompetitions)

        return CompetitionListResponseDto.fromResult(
            competitionResponses,
            result.page,
            result.limit,
            nonDraftCompetitions.length
        )
    }

    private buildFilters(query: CompetitionListQueryDto, context?: SearchContext): any {
        const filters: any = {
            examId: query.examId,
            search: query.search,
            startDateFrom: query.startDateFrom,
            endDateTo: query.endDateTo,
        }

        // const user = context?.user
        // const permissions = user?.permissions ?? []

        // // Case 1: No user or student user - only PUBLISHED competitions
        // if (!user || user.studentId) {
        //     filters.visibility = Visibility.PUBLISHED
        //     filters.createdBy = undefined
        //     return filters
        // }

        // Case 2: Admin with GET_ALL permission - PUBLISHED and PRIVATE (exclude DRAFT)
        // if (permissions.includes(PERMISSION_CODES.COMPETITION.GET_ALL)) {
            // No visibility filter here - we'll get all and filter out DRAFT after
            // But we can exclude DRAFT in the query for efficiency
            filters.visibility = undefined
            filters.createdBy = undefined
            // filters.excludeVisibility = Visibility.DRAFT
            return filters
        // }

        // Case 3: Admin with GET_MY_COMPETITIONS permission - only their PUBLISHED and PRIVATE competitions
        // if (permissions.includes(PERMISSION_CODES.COMPETITION.GET_MY_COMPETITIONS)) {
        //     filters.visibility = undefined
        //     filters.createdBy = user.adminId
        //     filters.excludeVisibility = Visibility.DRAFT
        //     return filters
        // }

        // // Case 4: Default for other authenticated users - only PUBLISHED
        // filters.visibility = Visibility.PUBLISHED
        // filters.createdBy = undefined

        // return filters
    }
}
