import { Inject, Injectable } from '@nestjs/common'
import type {
    ICompetitionRepository,
    ICompetitionSubmitRepository,
    IMediaUsageRepository,
} from '../../../domain/repositories'
import {
    CompetitionRankingEntryDto,
    CompetitionRankingResponseDto,
} from '../../dtos/competition/competition-ranking.dto'
import { NotFoundException, ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { CompetitionSubmitStatus } from '../../../shared/enums/competition-submit-status.enum'
import { CompetitionSubmit } from '../../../domain/entities/exam/competition-submit.entity'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { FIELD_NAMES } from '../../../shared/constants'
import { MediaStatus } from '../../../shared/enums'

@Injectable()
export class GetCompetitionLeaderboardUseCase {
    private static readonly AVATAR_URL_EXPIRY_SECONDS = 3600 * 24
    private static readonly PRESIGNED_URL_BATCH_SIZE = 20

    constructor(
        @Inject('ICompetitionRepository')
        private readonly competitionRepository: ICompetitionRepository,
        @Inject('ICompetitionSubmitRepository')
        private readonly competitionSubmitRepository: ICompetitionSubmitRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(
        competitionId: number,
        page = 1,
        limit = 10,
        studentId?: number,
    ): Promise<CompetitionRankingResponseDto> {
        const competition = await this.competitionRepository.findById(competitionId)

        if (!competition) {
            throw new NotFoundException(`Competition with ID ${competitionId} not found`)
        }

        if (!competition.allowLeaderboard) {
            throw new ForbiddenException('This competition does not allow viewing the leaderboard')
        }
        // console.log('Fetching all submits for competition', competitionId)
        // console.log('Competition details:', {
        //     startDate: competition.startDate,
        //     endDate: competition.endDate,
        // })
        const allSubmits = await this.competitionSubmitRepository.findByCompetition(competitionId)

        const validSubmits = allSubmits.filter((submit) => {
            if (submit.status !== CompetitionSubmitStatus.SUBMITTED) return false
            if (submit.totalPoints === null || submit.totalPoints === undefined) return false
            return this.isWithinCompetitionWindow(
                submit.startedAt,
                competition.startDate ?? null,
                competition.endDate ?? null,
            )
        })

        const bestByStudent = new Map<number, CompetitionSubmit>()

        for (const submit of validSubmits) {
            const currentBest = bestByStudent.get(submit.studentId)
            if (!currentBest || this.isBetterSubmit(submit, currentBest)) {
                bestByStudent.set(submit.studentId, submit)
            }
        }

        const sortedBestSubmits = Array.from(bestByStudent.values()).sort((a, b) => {
            const scoreA = Number(a.totalPoints ?? 0)
            const scoreB = Number(b.totalPoints ?? 0)
            if (scoreA !== scoreB) return scoreB - scoreA

            const timeA = a.timeSpentSeconds ?? Number.MAX_SAFE_INTEGER
            const timeB = b.timeSpentSeconds ?? Number.MAX_SAFE_INTEGER
            if (timeA !== timeB) return timeA - timeB

            return (a.startedAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
                - (b.startedAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
        })

        const total = sortedBestSubmits.length
        const currentUserIndex = studentId
            ? this.getCurrentUserIndex(sortedBestSubmits, studentId)
            : -1
        const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null
        const currentUserSubmit = currentUserIndex >= 0
            ? sortedBestSubmits[currentUserIndex]
            : null
        const safePage = Math.max(1, page)
        const safeLimit = Math.max(1, limit)
        const totalPages = Math.ceil(total / safeLimit)
        const offset = (safePage - 1) * safeLimit
        const pageItems = sortedBestSubmits.slice(offset, offset + safeLimit)
        const avatarSourceSubmits = currentUserSubmit
            && !pageItems.some((submit) => submit.studentId === currentUserSubmit.studentId)
            ? [...pageItems, currentUserSubmit]
            : pageItems
        const avatarMap = await this.buildAvatarMap(avatarSourceSubmits)

        const currentUserRanking = currentUserSubmit
            ? CompetitionRankingEntryDto.fromEntity(
                currentUserSubmit,
                currentUserRank!,
                avatarMap.get(currentUserSubmit.studentId),
            )
            : null

        const rankings = pageItems.map((submit, index) =>
            CompetitionRankingEntryDto.fromEntity(
                submit,
                offset + index + 1,
                avatarMap.get(submit.studentId),
            ),
        )

        return {
            success: true,
            message: 'Competition leaderboard retrieved successfully',
            data: {
                competitionId: competition.competitionId,
                competitionTitle: competition.title,
                currentUserRank,
                currentUserRanking,
                rankings,
                pagination: {
                    total,
                    page: safePage,
                    limit: safeLimit,
                    totalPages,
                },
            },
        }
    }

    private isWithinCompetitionWindow(startedAt: Date, startDate: Date | null, endDate: Date | null): boolean {
        if (startDate && startedAt < startDate) return false
        if (endDate && startedAt > endDate) return false
        return true
    }

    private isBetterSubmit(candidate: CompetitionSubmit, current: CompetitionSubmit): boolean {
        const candidateScore = Number(candidate.totalPoints ?? 0)
        const currentScore = Number(current.totalPoints ?? 0)

        if (candidateScore !== currentScore) {
            return candidateScore > currentScore
        }

        const candidateTime = candidate.timeSpentSeconds ?? Number.MAX_SAFE_INTEGER
        const currentTime = current.timeSpentSeconds ?? Number.MAX_SAFE_INTEGER
        if (candidateTime !== currentTime) {
            return candidateTime < currentTime
        }

        return (candidate.startedAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
            < (current.startedAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
    }

    private getCurrentUserIndex(sortedBestSubmits: CompetitionSubmit[], studentId: number): number {
        return sortedBestSubmits.findIndex((submit) => submit.studentId === studentId)
    }

    private async buildAvatarMap(submits: CompetitionSubmit[]): Promise<Map<number, string>> {
        const studentIdToUserId = new Map<number, number>()
        for (const submit of submits) {
            const userId = submit.student?.user?.userId
            if (!userId) {
                continue
            }
            studentIdToUserId.set(submit.studentId, userId)
        }

        const userIds = [...new Set(studentIdToUserId.values())]
        if (!userIds.length) {
            return new Map<number, string>()
        }

        const usages = await this.mediaUsageRepository.findByEntities(
            EntityType.USER,
            userIds,
            FIELD_NAMES.AVATAR,
        )


        // Keep first media usage per user to match getStudentProfile behavior.
        const mediaByUserId = new Map<number, { bucketName: string; objectKey: string }>()
        for (const usage of usages) {
            if (mediaByUserId.has(usage.entityId)) {
                continue
            }

            if (!usage.media || usage.media.status !== MediaStatus.READY) {
                continue
            }

            mediaByUserId.set(usage.entityId, {
                bucketName: usage.media.bucketName,
                objectKey: usage.media.objectKey,
            })
        }

        const avatarByUserId = new Map<number, string>()
        const entries = Array.from(mediaByUserId.entries())
        for (let i = 0; i < entries.length; i += GetCompetitionLeaderboardUseCase.PRESIGNED_URL_BATCH_SIZE) {
            const batch = entries.slice(i, i + GetCompetitionLeaderboardUseCase.PRESIGNED_URL_BATCH_SIZE)
            const results = await Promise.all(
                batch.map(async ([userId, media]) => {
                    try {
                        const avatarUrl = await this.minioService.getPresignedUrl(
                            media.bucketName,
                            media.objectKey,
                            GetCompetitionLeaderboardUseCase.AVATAR_URL_EXPIRY_SECONDS,
                        )
                        return { userId, avatarUrl }
                    } catch {
                        return null
                    }
                }),
            )

            for (const result of results) {
                if (!result) {
                    continue
                }
                avatarByUserId.set(result.userId, result.avatarUrl)
            }
        }

        const avatarMap = new Map<number, string>()
        for (const [studentId, userId] of studentIdToUserId.entries()) {
            const avatarUrl = avatarByUserId.get(userId)
            if (avatarUrl) {
                avatarMap.set(studentId, avatarUrl)
            }
        }

        return avatarMap
    }
}
