// src/application/use-cases/learningItem/update-learning-item.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { UpdateLearningItemDto } from '../../dtos/learningItem/update-learning-item.dto'
import { LearningItemResponseDto } from '../../dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class UpdateLearningItemUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(id: number, dto: UpdateLearningItemDto, adminId?: number): Promise<BaseResponseDto<LearningItemResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const learningItemRepository = repos.learningItemRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository

            const existingLearningItem = await learningItemRepository.findById(id)

            if (!existingLearningItem) {
                if (adminId) {
                    await adminAuditLogRepository.create({
                        adminId,
                        actionKey: ACTION_KEYS.LEARNING_ITEM.UPDATE,
                        status: AuditStatus.FAIL,
                        resourceType: RESOURCE_TYPES.LEARNING_ITEM,
                        resourceId: id.toString(),
                        errorMessage: `Không tìm thấy learning item với ID ${id}`,
                    })
                }
                throw new NotFoundException(`Learning item with ID ${id} not found`)
            }

            const updatedLearningItem = await learningItemRepository.update(id, {
                title: dto.title,
                description: dto.description,
                competitionId: dto.competitionId,
            })

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.LEARNING_ITEM.UPDATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.LEARNING_ITEM,
                    resourceId: id.toString(),
                    beforeData: {
                        title: existingLearningItem.title,
                        description: existingLearningItem.description,
                    },
                    afterData: {
                        title: updatedLearningItem.title,
                        description: updatedLearningItem.description,
                    },
                })
            }

            return LearningItemResponseDto.fromEntity(updatedLearningItem)
        })

        return BaseResponseDto.success('Learning item updated successfully', result)
    }
}
