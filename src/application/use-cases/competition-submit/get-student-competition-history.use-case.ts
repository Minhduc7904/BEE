// src/application/use-cases/competition-submit/get-student-competition-history.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories'
import { StudentCompetitionHistoryQueryDto } from '../../dtos/competition-submit/student-competition-history-query.dto'
import {
    StudentCompetitionHistoryItemDto,
    StudentCompetitionHistoryListResponseDto,
} from '../../dtos/competition-submit/student-competition-history.dto'

@Injectable()
export class GetStudentCompetitionHistoryUseCase {
    constructor(
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) {}

    async execute(
        competitionId: number,
        studentId: number,
        query: StudentCompetitionHistoryQueryDto,
    ): Promise<StudentCompetitionHistoryListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const result = await this.competitionSubmitRepository.findStudentHistory(
            competitionId,
            studentId,
            pagination,
        )

        const history = result.competitionSubmits.map((item) =>
            StudentCompetitionHistoryItemDto.fromEntity(item),
        )

        return new StudentCompetitionHistoryListResponseDto(
            history,
            result.page,
            result.limit,
            result.total,
        )
    }
}
