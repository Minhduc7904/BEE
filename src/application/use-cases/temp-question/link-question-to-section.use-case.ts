// src/application/use-cases/temp-question/link-question-to-section.use-case.ts
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempQuestionRepository } from '../../../domain/repositories/temp-question.repository'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { LinkQuestionToSectionDto, TempQuestionResponseDto } from '../../dtos/temp-question'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class LinkQuestionToSectionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        tempQuestionId: number,
        dto: LinkQuestionToSectionDto,
    ): Promise<BaseResponseDto<TempQuestionResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempQuestionRepository: ITempQuestionRepository =
                repos.tempQuestionRepository
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository

            // Verify question exists
            const question = await tempQuestionRepository.findById(tempQuestionId)
            if (!question) {
                throw new NotFoundException(
                    `TempQuestion với ID ${tempQuestionId} không tồn tại`,
                )
            }

            // If tempSectionId is provided, verify section exists and belongs to same session
            if (dto.tempSectionId) {
                const section = await tempSectionRepository.findById(dto.tempSectionId)
                if (!section) {
                    throw new NotFoundException(
                        `TempSection với ID ${dto.tempSectionId} không tồn tại`,
                    )
                }

                // Verify section belongs to same session as question
                if (section.sessionId !== question.sessionId) {
                    throw new BadRequestException(
                        'Section và Question phải thuộc cùng một session',
                    )
                }
            }

            // Update question's tempSectionId
            const updatedQuestion = await tempQuestionRepository.update(tempQuestionId, {
                tempSectionId: dto.tempSectionId ?? null,
            })

            const responseDto = TempQuestionResponseDto.fromEntity(updatedQuestion)

            return {
                success: true,
                message: dto.tempSectionId 
                    ? 'Gắn câu hỏi vào section thành công'
                    : 'Gỡ câu hỏi khỏi section thành công',
                data: responseDto,
            }
        })
    }
}
