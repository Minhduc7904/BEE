// src/application/use-cases/videoContent/update-video-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateVideoContentDto } from '../../dtos/videoContent/update-video-content.dto'
import { VideoContentResponseDto } from '../../dtos/videoContent/video-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UpdateVideoContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateVideoContentDto, adminId?: number): Promise<BaseResponseDto<VideoContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const videoContentRepository = repos.videoContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingVideoContent = await videoContentRepository.findById(id)
            if (!existingVideoContent) {
                throw new NotFoundException(`Video content with ID ${id} not found`)
            }

            const videoContent = await videoContentRepository.update(id, dto)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.VIDEO_CONTENT.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.VIDEO_CONTENT,
                    resourceId: videoContent.videoContentId.toString(),
                    beforeData: {
                        content: existingVideoContent.content,
                    },
                    afterData: {
                        content: videoContent.content,
                    },
                })
            }

            return VideoContentResponseDto.fromEntity(videoContent)
        })

        return BaseResponseDto.success('Video content updated successfully', result)
    }
}
