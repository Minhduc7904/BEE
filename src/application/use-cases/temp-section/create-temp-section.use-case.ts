// src/application/use-cases/temp-section/create-temp-section.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempSectionRepository } from '../../../domain/repositories/temp-section.repository'
import { CreateTempSectionDto, TempSectionResponseDto } from '../../dtos/temp-section'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class CreateTempSectionUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        sessionId: number,
        dto: CreateTempSectionDto,
    ): Promise<BaseResponseDto<TempSectionResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepository: ITempSectionRepository =
                repos.tempSectionRepository
            const examImportSessionRepository = repos.examImportSessionRepository

            // Verify session exists
            const session = await examImportSessionRepository.findById(sessionId)
            if (!session) {
                throw new NotFoundException(
                    `Session với ID ${sessionId} không tồn tại`,
                )
            }

            // Calculate order if not provided
            let order = dto.order
            if (order === undefined || order === null) {
                const existingSections = await tempSectionRepository.findBySessionId(sessionId)
                const maxOrder = existingSections.reduce(
                    (max, section) => Math.max(max, section.order ?? 0),
                    0,
                )
                order = maxOrder + 1
            }

            // Create section
            const tempSection = await tempSectionRepository.create({
                sessionId,
                tempExamId: session.tempExam?.tempExamId ?? null,
                title: dto.title,
                description: dto.description,
                order,
                metadata: dto.metadata,
            })

            const responseDto = TempSectionResponseDto.fromEntity(tempSection)

            return {
                success: true,
                message: 'Tạo section tạm thời thành công',
                data: responseDto,
            }
        })
    }
}
