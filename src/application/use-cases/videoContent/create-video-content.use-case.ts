// src/application/use-cases/videoContent/create-video-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateVideoContentDto } from '../../dtos/videoContent/create-video-content.dto'
import { VideoContentResponseDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

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

            const videoContent = await videoContentRepository.create({
                learningItemId: dto.learningItemId,
                content: dto.content,
            })

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
                    },
                })
            }

            return VideoContentResponseDto.fromEntity(videoContent)
        })

        return BaseResponseDto.success('Video content created successfully', result)
    }
}
