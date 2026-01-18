// src/application/use-cases/videoContent/delete-video-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class DeleteVideoContentUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, adminId?: number): Promise<BaseResponseDto<null>> {
        await this.unitOfWork.executeInTransaction(async (repos) => {
            const videoContentRepository = repos.videoContentRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const videoContent = await videoContentRepository.findById(id)
            if (!videoContent) {
                throw new NotFoundException(`Video content with ID ${id} not found`)
            }

            await videoContentRepository.delete(id)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.VIDEO_CONTENT.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.VIDEO_CONTENT,
                    resourceId: videoContent.videoContentId.toString(),
                    beforeData: {
                        learningItemId: videoContent.learningItemId,
                        content: videoContent.content,
                    },
                })
            }
        })

        return BaseResponseDto.success('Video content deleted successfully', null)
    }
}
