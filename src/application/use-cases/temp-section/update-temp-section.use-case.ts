// src/application/use-cases/temp-section/update-temp-section.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { UpdateTempSectionDto, TempSectionResponseDto } from '../../dtos/temp-section'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class UpdateTempSectionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        tempSectionId: number,
        dto: UpdateTempSectionDto,
    ): Promise<BaseResponseDto<TempSectionResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository

            // Verify section exists
            const existingSection = await tempSectionRepository.findById(tempSectionId)
            if (!existingSection) {
                throw new NotFoundException(
                    `TempSection với ID ${tempSectionId} không tồn tại`,
                )
            }

            // Update section
            const updatedSection = await tempSectionRepository.update(tempSectionId, {
                title: dto.title,
                description: dto.description,
                order: dto.order,
                metadata: dto.metadata,
            })

            const responseDto = TempSectionResponseDto.fromEntity(updatedSection)

            return {
                success: true,
                message: 'Cập nhật section tạm thời thành công',
                data: responseDto,
            }
        })
    }
}
