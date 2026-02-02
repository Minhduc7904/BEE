// src/application/use-cases/temp-section/reorder-temp-sections.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { ReorderTempSectionsDto } from '../../dtos/temp-section'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class ReorderTempSectionsUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: ReorderTempSectionsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository

            // Validate all sections exist
            for (const item of dto.items) {
                const section = await tempSectionRepository.findById(item.id)
                if (!section) {
                    throw new NotFoundException(
                        `TempSection với ID ${item.id} không tồn tại`,
                    )
                }
            }

            // Update order for each section
            for (const item of dto.items) {
                await tempSectionRepository.update(item.id, {
                    order: item.order,
                })
            }

            return {
                success: true,
                message: 'Cập nhật thứ tự section thành công',
                data: true,
            }
        })
    }
}
