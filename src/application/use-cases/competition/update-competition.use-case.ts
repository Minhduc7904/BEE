// src/application/use-cases/competition/update-competition.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork, IMediaRepository } from '../../../domain/repositories'
import { UpdateCompetitionDto } from '../../dtos/competition/update-competition.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionResponseDto } from '../../dtos/competition/competition.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { NotFoundException, BusinessLogicException } from '../../../shared/exceptions/custom-exceptions'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { COMPETITION_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class UpdateCompetitionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,

        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,

        private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
    ) { }

    async execute(
        id: number,
        dto: UpdateCompetitionDto,
        adminId?: number,
    ): Promise<BaseResponseDto<CompetitionResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const competitionRepository = repos.competitionRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Check if competition exists
            const existing = await competitionRepository.findById(id)
            if (!existing) {
                throw new NotFoundException('Cuộc thi không tồn tại')
            }

            // Validate examId update: only allow if currently null
            if (dto.examId !== undefined) {
                if (existing.examId !== null && existing.examId !== undefined) {
                    throw new BusinessLogicException('Không thể thay đổi đề thi sau khi đã được gán')
                }
            }

            const updateData: any = {
                ...(dto.examId !== undefined && { examId: dto.examId }),
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
                ...(dto.startDate !== undefined && { startDate: dto.startDate }),
                ...(dto.endDate !== undefined && { endDate: dto.endDate }),
                ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
                ...(dto.maxAttempts !== undefined && { maxAttempts: dto.maxAttempts }),
                ...(dto.visibility !== undefined && { visibility: dto.visibility }),
                ...(dto.showResultDetail !== undefined && { showResultDetail: dto.showResultDetail }),
                ...(dto.allowLeaderboard !== undefined && { allowLeaderboard: dto.allowLeaderboard }),
                ...(dto.allowViewScore !== undefined && { allowViewScore: dto.allowViewScore }),
                ...(dto.allowViewAnswer !== undefined && { allowViewAnswer: dto.allowViewAnswer }),
                ...(dto.enableAntiCheating !== undefined && { enableAntiCheating: dto.enableAntiCheating }),
            }

            // Handle policies with media normalization
            if (dto.policies !== undefined) {
                const oldPolicies = existing.policies

                const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
                    { fieldName: COMPETITION_MEDIA_FIELDS.POLICIES, content: dto.policies },
                ])

                const normalizedPolicies = this.attachMediaFromContentUseCase.getNormalizedContent(
                    normalizedResults,
                    COMPETITION_MEDIA_FIELDS.POLICIES,
                )

                updateData.policies = normalizedPolicies

                // Sync media changes for policies
                await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
                    oldPolicies,
                    normalizedPolicies,
                    EntityType.COMPETITION,
                    id,
                    adminId!,
                    repos.mediaUsageRepository,
                    COMPETITION_MEDIA_FIELDS.POLICIES,
                )
            }

            const competition = await competitionRepository.update(id, updateData)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COMPETITION.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COMPETITION,
                    resourceId: competition.competitionId.toString(),
                    beforeData: {
                        title: existing.title,
                        visibility: existing.visibility,
                    },
                    afterData: {
                        title: competition.title,
                        visibility: competition.visibility,
                    },
                })
            }

            return competition
        })

        const response = CompetitionResponseDto.fromEntity(result)
        return BaseResponseDto.success('Cập nhật cuộc thi thành công', response)
    }
}
