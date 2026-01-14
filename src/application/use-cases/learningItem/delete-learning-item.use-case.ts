// src/application/use-cases/learningItem/delete-learning-item.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { ILearningItemRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class DeleteLearningItemUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<null>> {
        const existingLearningItem = await this.learningItemRepository.findById(id)

        if (!existingLearningItem) {
            throw new NotFoundException(`Learning item with ID ${id} not found`)
        }

        await this.learningItemRepository.delete(id)

        return BaseResponseDto.success('Learning item deleted successfully', null)
    }
}
