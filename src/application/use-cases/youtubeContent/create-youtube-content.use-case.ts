// src/application/use-cases/youtubeContent/create-youtube-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateYoutubeContentDto } from '../../dtos/youtubeContent/create-youtube-content.dto'
import { YoutubeContentResponseDto } from '../../dtos/youtubeContent/youtube-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class CreateYoutubeContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateYoutubeContentDto, adminId?: number): Promise<BaseResponseDto<YoutubeContentResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const youtubeContentRepository = repos.youtubeContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const youtubeContent = await youtubeContentRepository.create({
                learningItemId: dto.learningItemId,
                content: dto.content,
                youtubeUrl: dto.youtubeUrl,
            })

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.YOUTUBE_CONTENT.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.YOUTUBE_CONTENT,
                    resourceId: youtubeContent.youtubeContentId.toString(),
                    afterData: {
                        learningItemId: youtubeContent.learningItemId,
                        content: youtubeContent.content,
                        youtubeUrl: youtubeContent.youtubeUrl,
                    },
                })
            }

            return YoutubeContentResponseDto.fromEntity(youtubeContent)
        })

        return BaseResponseDto.success('Youtube content created successfully', result)
    }
}
