// src/application/use-cases/homeworkContent/get-homework-content-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IHomeworkContentRepository } from '../../../domain/repositories'
import { HomeworkContentResponseDto } from '../../dtos/homeworkContent/homework-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetHomeworkContentByIdUseCase {
    constructor(
        @Inject('IHomeworkContentRepository')
        private readonly homeworkContentRepository: IHomeworkContentRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<HomeworkContentResponseDto>> {
        const homeworkContent = await this.homeworkContentRepository.findById(id)

        if (!homeworkContent) {
            throw new NotFoundException(`Homework content with ID ${id} not found`)
        }

        const dto = HomeworkContentResponseDto.fromEntity(homeworkContent)
        return BaseResponseDto.success('Homework content retrieved successfully', dto)
    }
}
