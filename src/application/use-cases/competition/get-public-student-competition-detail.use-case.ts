import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { Visibility } from '../../../shared/enums'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import {
    PublicStudentCompetitionDetailApiResponseDto,
    PublicStudentCompetitionDetailResponseDto,
} from '../../dtos/competition/public-student-competition.dto'

@Injectable()
export class GetPublicStudentCompetitionDetailUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(
        competitionId: number,
        studentId?: number,
    ): Promise<PublicStudentCompetitionDetailApiResponseDto> {
        const competition = await this.competitionRepository.findById(competitionId)

        if (!competition || competition.visibility !== Visibility.PUBLISHED) {
            throw new NotFoundException('Public competition not found')
        }

        let attemptedCount = 0
        if (studentId) {
            const submits = await this.competitionSubmitRepository.findByCompetitionAndStudent(
                competitionId,
                studentId,
            )
            attemptedCount = submits.length
        }

        const data = PublicStudentCompetitionDetailResponseDto.fromEntity(
            competition,
            attemptedCount,
        )

        return {
            success: true,
            message: 'Fetched public competition detail successfully',
            data,
        }
    }
}
