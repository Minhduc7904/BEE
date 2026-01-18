// src/application/use-cases/youtubeContent/update-youtube-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateYoutubeContentDto } from '../../dtos/youtubeContent/update-youtube-content.dto'
import { YoutubeContentResponseDto } from '../../dtos/youtubeContent/youtube-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UpdateYoutubeContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateYoutubeContentDto, adminId?: number): Promise<BaseResponseDto<YoutubeContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const youtubeContentRepository = repos.youtubeContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingYoutubeContent = await youtubeContentRepository.findById(id)
            if (!existingYoutubeContent) {
                throw new NotFoundException(`Youtube content with ID ${id} not found`)
            }

            const youtubeContent = await youtubeContentRepository.update(id, dto)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.YOUTUBE_CONTENT.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.YOUTUBE_CONTENT,
                    resourceId: youtubeContent.youtubeContentId.toString(),
                    beforeData: {
                        content: existingYoutubeContent.content,
                        youtubeUrl: existingYoutubeContent.youtubeUrl,
                    },
                    afterData: {
                        content: youtubeContent.content,
                        youtubeUrl: youtubeContent.youtubeUrl,
                    },
                })
            }

            return YoutubeContentResponseDto.fromEntity(youtubeContent)
        })

        return BaseResponseDto.success('Youtube content updated successfully', result)
    }
}
