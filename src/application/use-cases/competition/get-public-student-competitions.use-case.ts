// src/application/use-cases/competition/get-public-student-competitions.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { CompetitionListQueryDto } from '../../dtos/competition/competition-list-query.dto'
import { PublicCompetitionStatus, Visibility } from '../../../shared/enums'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import {
    PublicStudentCompetitionListResponseDto,
    PublicStudentCompetitionResponseDto,
} from '../../dtos/competition/public-student-competition.dto'

@Injectable()
export class GetPublicStudentCompetitionsUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(
        query: CompetitionListQueryDto,
        studentId?: number,
    ): Promise<PublicStudentCompetitionListResponseDto> {
        if (query.publicStatus === PublicCompetitionStatus.ATTEMPTED && !studentId) {
            const page = query.page || 1
            const limit = query.limit || 10
            return PublicStudentCompetitionListResponseDto.fromResult([], page, limit, 0)
        }

        const filters = {
            examId: query.examId,
            grade: query.grade,
            visibility: Visibility.PUBLISHED,
            search: query.search,
            publicStatus: query.publicStatus,
            attemptedByStudentId: studentId,
        }

        const pagination = {
            page: query.page || 1,
            limit: query.limit || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: (query.sortOrder || 'desc') as 'asc' | 'desc',
        }
        const result = await this.competitionRepository.findAllWithPagination(pagination, filters)
        const attemptCountByCompetitionId = new Map<number, number>()
        const inProgressByCompetitionId = new Map<number, boolean>()

        if (studentId && result.competitions.length > 0) {
            const competitionIds = new Set(result.competitions.map((c) => c.competitionId))
            const studentSubmits = await this.competitionSubmitRepository.findByStudent(studentId)

            for (const submit of studentSubmits) {
                if (!competitionIds.has(submit.competitionId)) continue
                const current = attemptCountByCompetitionId.get(submit.competitionId) ?? 0
                attemptCountByCompetitionId.set(submit.competitionId, current + 1)

                if (submit.status === CompetitionSubmitStatus.IN_PROGRESS) {
                    inProgressByCompetitionId.set(submit.competitionId, true)
                }
            }
        }

        const competitionResponses = PublicStudentCompetitionResponseDto.fromEntities(
            result.competitions,
            attemptCountByCompetitionId,
            inProgressByCompetitionId,
        )

        return PublicStudentCompetitionListResponseDto.fromResult(
            competitionResponses,
            result.page,
            result.limit,
            result.total,
        )
    }
}
