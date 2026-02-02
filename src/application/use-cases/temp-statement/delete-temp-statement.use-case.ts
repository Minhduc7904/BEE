// src/application/use-cases/temp-statement/delete-temp-statement.use-case.ts
import {
    Injectable,
    Inject,
    NotFoundException,
} from '@nestjs/common'
import type {
    IUnitOfWork,
    IMediaRepository,
} from '../../../domain/repositories'
import type {
    ITempStatementRepository,
} from '../../../domain/repositories/temp-statement.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import { extractAllMediaIds } from '../../../shared/utils'

@Injectable()
export class DeleteTempStatementUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,

        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
    ) { }

    async execute(
        tempStatementId: number,
    ): Promise<BaseResponseDto<boolean>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempStatementRepository: ITempStatementRepository =
                repos.tempStatementRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            /* ------------------------------------------------------------------
             * 1. Find TempStatement
             * ------------------------------------------------------------------ */
            const tempStatement = await tempStatementRepository.findById(tempStatementId)
            if (!tempStatement) {
                throw new NotFoundException(
                    `TempStatement ${tempStatementId} không tồn tại`,
                )
            }

            /* ------------------------------------------------------------------
             * 2. Extract ALL media IDs from statement content
             * ------------------------------------------------------------------ */
            const mediaIds = new Set<number>()
            if (tempStatement.content) {
                extractAllMediaIds(tempStatement.content).forEach(id => mediaIds.add(id))
            }

            /* ------------------------------------------------------------------
             * 3. Delete TempStatement first (this will cascade delete media usages)
             * ------------------------------------------------------------------ */
            const deletedOrder = tempStatement.order
            const tempQuestionId = tempStatement.tempQuestionId
            await tempStatementRepository.delete(tempStatementId)

            /* ------------------------------------------------------------------
             * 4. Reorder remaining statements in question
             * ------------------------------------------------------------------ */
            if (deletedOrder !== null && deletedOrder !== undefined) {
                const remainingStatements = await tempStatementRepository.findByTempQuestionId(tempQuestionId)
                
                // Update order for statements that had order > deletedOrder
                const statementsToUpdate = remainingStatements.filter(
                    s => s.order !== null && s.order !== undefined && s.order > deletedOrder
                )
                for (const statement of statementsToUpdate) {
                    await tempStatementRepository.update(statement.tempStatementId, {
                        order: statement.order! - 1
                    })
                }
            }

            /* ------------------------------------------------------------------
             * 5. Check and soft delete orphaned media
             * ------------------------------------------------------------------ */
            await Promise.all(
                Array.from(mediaIds).map(async (mediaId) => {
                    try {
                        // Check if media is still used elsewhere
                        const remainingUsages = await mediaUsageRepository.findByMedia(mediaId)

                        // If no more usages, soft delete the media
                        if (remainingUsages.length === 0) {
                            await this.mediaRepository.softDelete(mediaId)
                        }
                    } catch (err) {
                        console.error(`Failed to soft delete media ${mediaId}`, err)
                    }
                }),
            )

            /* ------------------------------------------------------------------
             * 6. Response
             * ------------------------------------------------------------------ */
            return {
                success: true,
                message: 'Xóa đáp án tạm thời thành công',
                data: true,
            }
        })
    }
}
