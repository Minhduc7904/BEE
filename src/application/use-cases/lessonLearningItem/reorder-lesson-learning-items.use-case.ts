// src/application/use-cases/lessonLearningItem/reorder-lesson-learning-items.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ILessonLearningItemRepository } from '../../../domain/repositories/lesson-learning-item.repository'
import { ReorderLessonLearningItemsDto } from '../../dtos/lessonLearningItem'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class ReorderLessonLearningItemsUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: ReorderLessonLearningItemsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const lessonLearningItemRepository: ILessonLearningItemRepository =
                repos.lessonLearningItemRepository

            // Validate all learning items exist in the lesson
            for (const item of dto.items) {
                const lessonLearningItem = await lessonLearningItemRepository.findByCompositeId(
                    dto.lessonId,
                    item.learningItemId,
                )
                if (!lessonLearningItem) {
                    throw new NotFoundException(
                        `Mục học với ID ${item.learningItemId} không tồn tại trong bài học ${dto.lessonId}`,
                    )
                }
            }

            // Update order for each learning item
            for (const item of dto.items) {
                await lessonLearningItemRepository.updateOrder(
                    dto.lessonId,
                    item.learningItemId,
                    item.order,
                )
            }

            return {
                success: true,
                message: 'Cập nhật thứ tự mục học thành công',
                data: true,
            }
        })
    }
}
