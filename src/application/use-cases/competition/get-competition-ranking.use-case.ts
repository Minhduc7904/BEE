// src/application/use-cases/competition/get-competition-ranking.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ICompetitionRepository, ICompetitionSubmitRepository } from '../../../domain/repositories'
import { 
    StudentOwnRankingResponseDto,
    StudentOwnRankingEntryDto,
} from '../../dtos/competition/competition-ranking.dto'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'

@Injectable()
export class GetCompetitionRankingUseCase {
    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
    ) { }

    async execute(
        competitionId: number,
        studentId: number,
    ): Promise<StudentOwnRankingResponseDto> {
        // 1. Kiểm tra competition có tồn tại không
        const competition = await this.competitionRepository.findById(competitionId)
        
        if (!competition) {
            throw new NotFoundException(`Competition with ID ${competitionId} not found`)
        }

        // 2. Kiểm tra competition có cho phép xem ranking không
        if (!competition.allowLeaderboard) {
            throw new ForbiddenException('This competition does not allow viewing the leaderboard')
        }

        // 3. Lấy tất cả submits của student trong competition
        const studentSubmits = await this.competitionSubmitRepository.findByCompetitionAndStudent(
            competitionId,
            studentId,
        )

        if (studentSubmits.length === 0) {
            // Student chưa làm bài nào
            return {
                success: true,
                message: 'You have not submitted any attempts for this competition yet',
                data: {
                    competitionId: competition.competitionId,
                    competitionTitle: competition.title,
                    totalAttempts: 0,
                    highestScore: 0,
                    highestRank: undefined,
                    attempts: [],
                },
            }
        }

        // 4. Lấy tất cả graded submits trong competition để tính rank
        const allGradedSubmits = await this.competitionSubmitRepository.getLeaderboard(
            competitionId,
            999999, // Lấy tất cả
        )

        // 5. Tính rank cho từng submit của student
        const attempts: StudentOwnRankingEntryDto[] = []
        let highestScore = 0
        let highestRank: number | undefined = undefined

        for (const submit of studentSubmits) {
            // Chỉ tính rank cho submits đã GRADED
            if (submit.status === CompetitionSubmitStatus.GRADED && submit.totalPoints !== null) {
                const score = Number(submit.totalPoints)
                
                // Tính rank: đếm có bao nhiêu submits có điểm cao hơn
                const rank = allGradedSubmits.filter(s => {
                    const sScore = Number(s.totalPoints || 0)
                    if (sScore > score) return true
                    if (sScore === score) {
                        // Nếu điểm bằng nhau, ưu tiên người làm nhanh hơn
                        const sTime = s.timeSpentSeconds || 999999
                        const submitTime = submit.timeSpentSeconds || 999999
                        if (sTime < submitTime) return true
                        if (sTime === submitTime) {
                            // Nếu thời gian bằng nhau, ưu tiên người nộp trước
                            return (s.submittedAt || new Date()) < (submit.submittedAt || new Date())
                        }
                    }
                    return false
                }).length + 1

                attempts.push(StudentOwnRankingEntryDto.fromEntity(submit, rank))

                // Cập nhật highestScore và highestRank
                if (score > highestScore || highestScore === 0) {
                    highestScore = score
                    highestRank = rank
                } else if (score === highestScore && (!highestRank || rank < highestRank)) {
                    highestRank = rank
                }
            } else {
                // Submit chưa được chấm hoặc đang xử lý
                attempts.push(StudentOwnRankingEntryDto.fromEntity(submit, 0))
            }
        }

        // 6. Sort attempts by attemptNumber
        attempts.sort((a, b) => a.attemptNumber - b.attemptNumber)

        // 7. Return response
        return {
            success: true,
            message: 'Your competition ranking retrieved successfully',
            data: {
                competitionId: competition.competitionId,
                competitionTitle: competition.title,
                totalAttempts: studentSubmits.length,
                highestScore,
                highestRank,
                attempts,
            },
        }
    }
}
