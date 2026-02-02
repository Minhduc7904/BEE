// src/application/use-cases/temp-section/delete-temp-section.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class DeleteTempSectionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(tempSectionId: number): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository

            // Verify section exists
            const tempSection = await tempSectionRepository.findById(tempSectionId)
            if (!tempSection) {
                throw new NotFoundException(
                    `TempSection với ID ${tempSectionId} không tồn tại`,
                )
            }

            const deletedOrder = tempSection.order
            const sessionId = tempSection.sessionId

            // Delete section (cascade to questions/statements)
            await tempSectionRepository.delete(tempSectionId)

            // Reorder remaining sections in the same session
            const remainingSections = await tempSectionRepository.findBySessionId(sessionId)
            const sectionsToUpdate = remainingSections.filter(s => s.order > deletedOrder)
            
            for (const section of sectionsToUpdate) {
                await tempSectionRepository.update(section.tempSectionId, {
                    order: section.order - 1,
                })
            }

            return {
                success: true,
                message: 'Xóa section tạm thời thành công',
                data: true,
            }
        })
    }
}
