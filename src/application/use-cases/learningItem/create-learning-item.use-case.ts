// src/application/use-cases/learningItem/create-learning-item.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { ILearningItemRepository } from '../../../domain/repositories'
import { CreateLearningItemDto } from '../../dtos/learningItem/create-learning-item.dto'
import { LearningItemResponseDto } from '../../dtos/learningItem/learning-item.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class CreateLearningItemUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
    ) { }

    async execute(dto: CreateLearningItemDto): Promise<BaseResponseDto<LearningItemResponseDto>> {
        const learningItem = await this.learningItemRepository.create({
            type: dto.type,
            title: dto.title,
            description: dto.description,
            competitionId: dto.competitionId,
            createdBy: dto.createdBy,
        })

        const responseDto = LearningItemResponseDto.fromEntity(learningItem)

        return BaseResponseDto.success('Learning item created successfully', responseDto)
    }
}
