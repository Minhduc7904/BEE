// src/application/use-cases/learningItem/create-learning-item.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { CreateLearningItemDto } from '../../dtos/learningItem/create-learning-item.dto'
import { LearningItemResponseDto } from '../../dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'

@Injectable()
export class CreateLearningItemUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(dto: CreateLearningItemDto, adminId: number): Promise<BaseResponseDto<LearningItemResponseDto>> {
        const result = await this.unitOfWork.executeInTransaction(async (repos) => {
            const learningItemRepository = repos.learningItemRepository
            const adminAuditLogRepository = repos.adminAuditLogRepository
            const lessonLearningItemRepository = repos.lessonLearningItemRepository

            const learningItem = await learningItemRepository.create({
                type: dto.type,
                title: dto.title,
                description: dto.description,
                competitionId: dto.competitionId,
                createdBy: adminId,
            })

            // If lessonId is provided, create LessonLearningItem relationship
            if (dto.lessonId) {
                let order = dto.order

                // If order is not provided, get the next order number
                if (order === undefined || order === null) {
                    const existingItems = await lessonLearningItemRepository.findByLesson(dto.lessonId)
                    const maxOrder = existingItems.reduce((max, item) => {
                        return item.order && item.order > max ? item.order : max
                    }, 0)
                    order = maxOrder + 1
                }

                await lessonLearningItemRepository.create({
                    lessonId: dto.lessonId,
                    learningItemId: learningItem.learningItemId,
                    order,
                })
            }

            if (adminId) {
                await adminAuditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.LEARNING_ITEM.CREATE,
                    status: AuditStatus.SUCCESS,
                    resourceType: RESOURCE_TYPES.LEARNING_ITEM,
                    resourceId: learningItem.learningItemId.toString(),
                    afterData: {
                        type: learningItem.type,
                        title: learningItem.title,
                        description: learningItem.description,
                        createdBy: adminId,
                        lessonId: dto.lessonId,
                        order: dto.order,
                    },
                })
            }

            return LearningItemResponseDto.fromEntity(learningItem)
        })

        return BaseResponseDto.success('Learning item created successfully', result)
    }
}
