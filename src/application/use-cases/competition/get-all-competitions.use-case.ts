// src/application/use-cases/competition/get-all-competitions.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories'
import { CompetitionListQueryDto } from '../../dtos/competition/competition-list-query.dto'
import { CompetitionListResponseDto, CompetitionResponseDto } from '../../dtos/competition/competition.dto'
import { ProcessContentWithPresignedUrlsUseCase, type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { COMPETITION_CONTENT_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class GetAllCompetitionsUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        private readonly processContentUseCase: ProcessContentWithPresignedUrlsUseCase,
    ) { }

    async execute(query: CompetitionListQueryDto): Promise<CompetitionListResponseDto> {
        const filters = {
            examId: query.examId,
            visibility: query.visibility,
            createdBy: query.createdBy,
            search: query.search,
            startDateFrom: query.startDateFrom,
            endDateTo: query.endDateTo,
        }

        const pagination = {
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
        }

        const result = await this.competitionRepository.findAllWithPagination(pagination, filters)

        const competitionResponses = CompetitionResponseDto.fromEntities(result.competitions)

        // Process policies with presigned URLs for each competition
        for (const response of competitionResponses) {
            if (response.policies) {
                const contentFields: ContentField[] = [
                    { fieldName: COMPETITION_CONTENT_FIELDS.POLICIES, content: response.policies },
                ]

                const processedResults = await this.processContentUseCase.execute(
                    contentFields,
                    3600, // Default 1 hour expiry
                )

                response.processedPolicies = this.processContentUseCase.getProcessedContent(
                    processedResults,
                    COMPETITION_CONTENT_FIELDS.POLICIES,
                ) || response.policies
            }
        }

        return CompetitionListResponseDto.fromResult(competitionResponses, result.page, result.limit, result.total)
    }
}
