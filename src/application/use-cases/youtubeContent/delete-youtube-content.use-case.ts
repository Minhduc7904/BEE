// src/application/use-cases/youtubeContent/delete-youtube-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class DeleteYoutubeContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, adminId?: number): Promise<BaseResponseDto<null>> {
        await this.unitOfWork.executeInTransaction(async (repos) => {
            const youtubeContentRepository = repos.youtubeContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const youtubeContent = await youtubeContentRepository.findById(id)
            if (!youtubeContent) {
                throw new NotFoundException(`Youtube content with ID ${id} not found`)
            }

            await youtubeContentRepository.delete(id)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.YOUTUBE_CONTENT.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.YOUTUBE_CONTENT,
                    resourceId: youtubeContent.youtubeContentId.toString(),
                    beforeData: {
                        learningItemId: youtubeContent.learningItemId,
                        content: youtubeContent.content,
                        youtubeUrl: youtubeContent.youtubeUrl,
                    },
                })
            }
        })

        return BaseResponseDto.success('Youtube content deleted successfully', null)
    }
}
