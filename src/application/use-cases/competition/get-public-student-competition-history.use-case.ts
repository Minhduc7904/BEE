import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository, ICompetitionSubmitRepository } from '../../../domain/repositories'
import { Visibility } from '../../../shared/enums'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { StudentCompetitionHistoryQueryDto } from '../../dtos/competition-submit/student-competition-history-query.dto'
import {
    StudentCompetitionHistoryItemDto,
    StudentCompetitionHistoryListResponseDto,
} from '../../dtos/competition-submit/student-competition-history.dto'

@Injectable()
export class GetPublicStudentCompetitionHistoryUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(
        competitionId: number,
        studentId: number,
        query: StudentCompetitionHistoryQueryDto,
    ): Promise<StudentCompetitionHistoryListResponseDto> {
        const competition = await this.competitionRepository.findById(competitionId)

        if (!competition) {
            throw new NotFoundException('Public competition not found')
        }

        if (!competition.allowViewScore) {
            throw new ForbiddenException('This competition does not allow viewing scores')
        }

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

        const canViewDetail = !!(competition.allowViewAnswer || competition.showResultDetail)

        const history = result.competitionSubmits.map((item) =>
            StudentCompetitionHistoryItemDto.fromEntity(item, canViewDetail),
        )

        return new StudentCompetitionHistoryListResponseDto(
            history,
            result.page,
            result.limit,
            result.total,
        )
    }
}
