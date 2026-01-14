// src/application/use-cases/learningItem/get-learning-item-by-id.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ILearningItemRepository } from '../../../domain/repositories'
import { LearningItemResponseDto } from '../../dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetLearningItemByIdUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<LearningItemResponseDto>> {
        const learningItem = await this.learningItemRepository.findById(id)

        if (!learningItem) {
            throw new NotFoundException(`Learning item with ID ${id} not found`)
        }

        const dto = LearningItemResponseDto.fromEntity(learningItem)

        return BaseResponseDto.success('Learning item retrieved successfully', dto)
    }
}
