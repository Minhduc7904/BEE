// src/application/use-cases/homeworkSubmit/get-homework-submit-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IHomeworkSubmitRepository } from '../../../domain/repositories'
import { HomeworkSubmitResponseDto } from '../../dtos/homeworkSubmit/homework-submit.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetHomeworkSubmitByIdUseCase {
    constructor(
        @Inject('IHomeworkSubmitRepository')
        private readonly homeworkSubmitRepository: IHomeworkSubmitRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<HomeworkSubmitResponseDto>> {
        const homeworkSubmit = await this.homeworkSubmitRepository.findById(id)

        if (!homeworkSubmit) {
            throw new NotFoundException(`Homework submit with ID ${id} not found`)
        }

        const dto = HomeworkSubmitResponseDto.fromEntity(homeworkSubmit)
        return BaseResponseDto.success('Homework submit retrieved successfully', dto)
    }
}
