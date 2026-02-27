// src/application/use-cases/competition-submit/get-all-competition-submits.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories'
import { CompetitionSubmitListQueryDto } from '../../dtos/competition-submit/competition-submit-list-query.dto'
import { CompetitionSubmitResponseDto, CompetitionSubmitListResponseDto } from '../../dtos/competition-submit/competition-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllCompetitionSubmitsUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(query: CompetitionSubmitListQueryDto): Promise<CompetitionSubmitListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            competitionId: query.competitionId,
            studentId: query.studentId,
            status: query.status,
            attemptNumber: query.attemptNumber,
            isGraded: query.isGraded,
            startedFrom: query.startedFrom ? new Date(query.startedFrom) : undefined,
            startedTo: query.startedTo ? new Date(query.startedTo) : undefined,
        }

        const result = await this.competitionSubmitRepository.findAllWithPagination(pagination, filters)

        const dtos = result.competitionSubmits.map((item) =>
            CompetitionSubmitResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success('Lấy danh sách bài nộp thành công', {
            competitionSubmits: dtos,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        })
    }
}
