// src/application/use-cases/videoContent/create-video-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateVideoContentDto } from '../../dtos/videoContent/create-video-content.dto'
import { VideoContentResponseDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaVisibility } from 'src/shared/enums'
import { FIELD_NAMES } from 'src/shared/constants'

@Injectable()
export class CreateVideoContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateVideoContentDto, adminId?: number): Promise<BaseResponseDto<VideoContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const videoContentRepository = repos.videoContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            const videoContent = await videoContentRepository.create({
                learningItemId: dto.learningItemId,
                content: dto.content,
            })

            // Attach media usage if mediaId provided
            if (dto.mediaId) {
                await mediaUsageRepository.attach({
                    mediaId: dto.mediaId,
                    entityType: EntityType.VIDEO_CONTENT,
                    entityId: videoContent.videoContentId,
                    fieldName: FIELD_NAMES.VIDEO_FILE,
                    usedBy: adminId,
                    visibility: MediaVisibility.PUBLIC,
                })
            }

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.VIDEO_CONTENT.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.VIDEO_CONTENT,
                    resourceId: videoContent.videoContentId.toString(),
                    afterData: {
                        learningItemId: videoContent.learningItemId,
                        content: videoContent.content,
                        mediaId: dto.mediaId,
                    },
                })
            }

            return VideoContentResponseDto.fromEntity(videoContent)
        })

        return BaseResponseDto.success('Video content created successfully', result)
    }
}
