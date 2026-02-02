// src/application/use-cases/temp-question/reorder-temp-questions.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempQuestionRepository } from '../../../domain/repositories/temp-question.repository'
import { ReorderTempQuestionsDto } from '../../dtos/temp-question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class ReorderTempQuestionsUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: ReorderTempQuestionsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempQuestionRepository: ITempQuestionRepository =
                repos.tempQuestionRepository

            // Validate all questions exist
            for (const item of dto.items) {
                const question = await tempQuestionRepository.findById(item.id)
                if (!question) {
                    throw new NotFoundException(
                        `TempQuestion với ID ${item.id} không tồn tại`,
                    )
                }
            }

            // Update order for each question
            for (const item of dto.items) {
                await tempQuestionRepository.update(item.id, {
                    order: item.order,
                })
            }

            return {
                success: true,
                message: 'Cập nhật thứ tự câu hỏi thành công',
                data: true,
            }
        })
    }
}
