// src/application/use-cases/competition/create-competition.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import { CreateCompetitionDto } from '../../dtos/competition/create-competition.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CompetitionResponseDto } from '../../dtos/competition/competition.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { Visibility } from 'src/shared/enums'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { COMPETITION_MEDIA_FIELDS } from '../../../shared/constants/media-field-name.constants'

@Injectable()
export class CreateCompetitionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,

        private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
    ) { }

    async execute(dto: CreateCompetitionDto, adminId?: number): Promise<BaseResponseDto<CompetitionResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const competitionRepository = repos.competitionRepository
            const mediaUsageRepository = repos.mediaUsageRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            // Normalize and extract media from policies field
            const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
                { fieldName: COMPETITION_MEDIA_FIELDS.POLICIES, content: dto.policies },
            ])

            const createData = {
                title: dto.title,
                subtitle: dto.subtitle,
                examId: dto.examId,
                policies: this.attachMediaFromContentUseCase.getNormalizedContent(normalizedResults, COMPETITION_MEDIA_FIELDS.POLICIES),
                startDate: dto.startDate,
                endDate: dto.endDate,
                durationMinutes: dto.durationMinutes,
                maxAttempts: dto.maxAttempts,
                visibility: dto.visibility || Visibility.DRAFT,
                showResultDetail: dto.showResultDetail ?? false,
                allowLeaderboard: dto.allowLeaderboard ?? false,
                allowViewScore: dto.allowViewScore ?? true,
                allowViewAnswer: dto.allowViewAnswer ?? false,
                enableAntiCheating: dto.enableAntiCheating ?? false,
                adminId: adminId!,
            }

            const competition = await competitionRepository.create(createData)

            // Attach media to competition
            await this.attachMediaFromContentUseCase.attachMedia(
                normalizedResults,
                EntityType.COMPETITION,
                competition.competitionId,
                adminId!,
                mediaUsageRepository,
            )

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.COMPETITION.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.COMPETITION,
                    resourceId: competition.competitionId.toString(),
                    afterData: {
                        title: competition.title,
                        visibility: competition.visibility,
                        startDate: competition.startDate,
                        endDate: competition.endDate,
                    },
                })
            }

            return competition
        })

        const response = CompetitionResponseDto.fromEntity(result)
        return BaseResponseDto.success('Tạo cuộc thi thành công', response)
    }
}
