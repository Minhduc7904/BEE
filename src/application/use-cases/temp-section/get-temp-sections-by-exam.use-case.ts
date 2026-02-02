// src/application/use-cases/temp-section/get-temp-sections-by-exam.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { TempSectionResponseDto } from '../../dtos/temp-section'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetTempSectionsByExamUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(sessionId: number): Promise<BaseResponseDto<TempSectionResponseDto[]>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository

            const tempSections = await tempSectionRepository.findBySessionId(sessionId)

            const responseDtos = tempSections.map(section =>
                TempSectionResponseDto.fromEntity(section),
            )

            return {
                success: true,
                message: 'Lấy danh sách section tạm thời thành công',
                data: responseDtos,
            }
        })
    }
}
