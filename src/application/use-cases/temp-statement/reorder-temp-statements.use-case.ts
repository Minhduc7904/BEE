// src/application/use-cases/temp-statement/reorder-temp-statements.use-case.ts
import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import type { IUnitOfWork } from '../../../domain/repositories'
import type { ITempStatementRepository } from '../../../domain/repositories/temp-statement.repository'
import { ReorderTempStatementsDto } from '../../dtos/temp-statement'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class ReorderTempStatementsUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
    ) { }

    async execute(
        dto: ReorderTempStatementsDto,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempStatementRepository: ITempStatementRepository =
                repos.tempStatementRepository

            // Validate all statements exist
            for (const item of dto.items) {
                const statement = await tempStatementRepository.findById(item.id)
                if (!statement) {
                    throw new NotFoundException(
                        `TempStatement với ID ${item.id} không tồn tại`,
                    )
                }
            }

            // Update order for each statement
            for (const item of dto.items) {
                await tempStatementRepository.update(item.id, {
                    order: item.order,
                })
            }

            return {
                success: true,
                message: 'Cập nhật thứ tự đáp án thành công',
                data: true,
            }
        })
    }
}
