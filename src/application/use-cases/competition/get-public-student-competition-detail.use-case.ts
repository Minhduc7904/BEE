import { Inject, Injectable } from '@nestjs/common'
import type { ICompetitionRepository } from '../../../domain/repositories'
import type { ICompetitionSubmitRepository } from '../../../domain/repositories/competition-submit.repository'
import { Visibility } from '../../../shared/enums'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
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
        let hasInProgress = false
        let bestSubmittedScore: number | null = null
        if (studentId) {
            const submits = await this.competitionSubmitRepository.findByCompetitionAndStudent(
                competitionId,
                studentId,
            )
            attemptedCount = submits.length
            hasInProgress = submits.some((submit) => submit.status === CompetitionSubmitStatus.IN_PROGRESS)

            if (competition.allowViewScore) {
                const submittedSubmits = submits.filter(
                    (submit) => submit.status === CompetitionSubmitStatus.SUBMITTED
                        && submit.totalPoints !== null
                        && submit.totalPoints !== undefined,
                )

                if (submittedSubmits.length > 0) {
                    const bestSubmit = submittedSubmits.reduce((best, current) => {
                        const bestScore = Number(best.totalPoints ?? 0)
                        const currentScore = Number(current.totalPoints ?? 0)
                        return currentScore > bestScore ? current : best
                    })
                    bestSubmittedScore = Number(bestSubmit.totalPoints ?? 0)
                }
            }
        }

        const data = PublicStudentCompetitionDetailResponseDto.fromEntity(
            competition,
            attemptedCount,
            hasInProgress,
            undefined,
            bestSubmittedScore,
        )

        return {
            success: true,
            message: 'Fetched public competition detail successfully',
            data,
        }
    }
}
