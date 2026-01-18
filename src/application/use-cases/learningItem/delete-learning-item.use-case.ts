// src/application/use-cases/learningItem/delete-learning-item.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class DeleteLearningItemUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, adminId?: number): Promise<BaseResponseDto<null>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const learningItemRepository = repos.learningItemRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingLearningItem = await learningItemRepository.findById(id)

            if (!existingLearningItem) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.LEARNING_ITEM.DELETE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.LEARNING_ITEM,
                        resourceId: id.toString(),
                        errorMessage: `Không tìm thấy learning item với ID ${id}`,
                    })
                }
                throw new NotFoundException(`Learning item with ID ${id} not found`)
            }

            await learningItemRepository.delete(id)

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.LEARNING_ITEM.DELETE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.LEARNING_ITEM,
                    resourceId: id.toString(),
                    beforeData: {
                        type: existingLearningItem.type,
                        title: existingLearningItem.title,
                        description: existingLearningItem.description,
                        createdBy: existingLearningItem.createdBy,
                    },
                })
            }

            return null
        })

        return BaseResponseDto.success('Learning item deleted successfully', result)
    }
}
