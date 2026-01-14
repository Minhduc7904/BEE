// src/application/use-cases/learningItem/update-learning-item.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ILearningItemRepository } from '../../../domain/repositories'
import { UpdateLearningItemDto } from '../../dtos/learningItem/update-learning-item.dto'
import { LearningItemResponseDto } from '../../dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class UpdateLearningItemUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
    ) { }

    async execute(id: number, dto: UpdateLearningItemDto): Promise<BaseResponseDto<LearningItemResponseDto>> {
        const existingLearningItem = await this.learningItemRepository.findById(id)

        if (!existingLearningItem) {
            throw new NotFoundException(`Learning item with ID ${id} not found`)
        }

        const updatedLearningItem = await this.learningItemRepository.update(id, {
            type: dto.type,
            title: dto.title,
            description: dto.description,
            competitionId: dto.competitionId,
        })

        const responseDto = LearningItemResponseDto.fromEntity(updatedLearningItem)

        return BaseResponseDto.success('Learning item updated successfully', responseDto)
    }
}
