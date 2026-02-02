// src/application/use-cases/temp-section/get-temp-section-by-id.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { TempSectionResponseDto } from '../../dtos/temp-section'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetTempSectionByIdUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(tempSectionId: number): Promise<BaseResponseDto<TempSectionResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository

            const tempSection = await tempSectionRepository.findById(tempSectionId)
            if (!tempSection) {
                throw new NotFoundException(
                    `TempSection với ID ${tempSectionId} không tồn tại`,
                )
            }

            const responseDto = TempSectionResponseDto.fromEntity(tempSection)

            return {
                success: true,
                message: 'Lấy section tạm thời thành công',
                data: responseDto,
            }
        })
    }
}
