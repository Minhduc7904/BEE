// src/application/use-cases/temp-statement/update-temp-statement.use-case.ts
import {
    Injectable,
    Inject,
    NotFoundException,
} from '@nestjs/common'
import type {
    IMediaRepository,
    IMediaUsageRepository,
} from '../../../domain/repositories'
import type {
    ITempStatementRepository,
} from '../../../domain/repositories/temp-statement.repository'
import {
    UpdateTempStatementDto,
    TempStatementResponseDto,
} from '../../dtos/temp-statement'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import {
    extractAllMediaIds,
    normalizeMediaMarkdown,
} from '../../../shared/utils'

@Injectable()
export class UpdateTempStatementUseCase {
    constructor(
        @Inject('ITempStatementRepository')
        private readonly tempStatementRepository: ITempStatementRepository,
        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
    ) { }

    async execute(
        tempStatementId: number,
        dto: UpdateTempStatementDto,
        userId: number,
    ): Promise<BaseResponseDto<TempStatementResponseDto>> {
        /* ------------------------------------------------------------------
         * 1. Find existing TempStatement
         * ------------------------------------------------------------------ */
        const existingTempStatement = await this.tempStatementRepository.findById(tempStatementId)
        if (!existingTempStatement) {
            throw new NotFoundException(`TempStatement ${tempStatementId} không tồn tại`)
        }

        /* ------------------------------------------------------------------
         * 2. Normalize markdown for content
         * ------------------------------------------------------------------ */
        const normalizedContent = dto.content ? normalizeMediaMarkdown(dto.content) : dto.content

        /* ------------------------------------------------------------------
         * 3. Extract OLD media IDs from existing content
         * ------------------------------------------------------------------ */
        const oldMediaIds = new Set<number>()
        if (existingTempStatement.content) {
            extractAllMediaIds(existingTempStatement.content).forEach(id => oldMediaIds.add(id))
        }

        /* ------------------------------------------------------------------
         * 4. Extract NEW media IDs from updated content
         * ------------------------------------------------------------------ */
        const newMediaIds = new Set<number>()
        if (normalizedContent) {
            extractAllMediaIds(normalizedContent).forEach(id => newMediaIds.add(id))
        }

        /* ------------------------------------------------------------------
         * 5. Attach NEW media that wasn't in old content
         * ------------------------------------------------------------------ */
        const addedMediaIds = Array.from(newMediaIds).filter(id => !oldMediaIds.has(id))

        await Promise.all(
            addedMediaIds.map(async (mediaId) => {
                try {
                    const media = await this.mediaRepository.findById(mediaId)
                    if (!media) return

                    const exists = await this.mediaUsageRepository.exists(
                        mediaId,
                        EntityType.TEMP_STATEMENT,
                        tempStatementId,
                    )

                    if (!exists) {
                        await this.mediaUsageRepository.attach({
                            mediaId,
                            entityType: EntityType.TEMP_STATEMENT,
                            entityId: tempStatementId,
                            usedBy: userId,
                        })
                    }
                } catch (err) {
                    console.error(`Failed to attach media ${mediaId}`, err)
                }
            }),
        )

        /* ------------------------------------------------------------------
         * 6. Detach and soft delete media that was removed from content
         * ------------------------------------------------------------------ */
        const removedMediaIds = Array.from(oldMediaIds).filter(id => !newMediaIds.has(id))

        await Promise.all(
            removedMediaIds.map(async (mediaId) => {
                try {
                    // 6.1 Detach usage of THIS temp statement
                    const usages = await this.mediaUsageRepository.findByMedia(mediaId)

                    const statementUsage = usages.find(
                        (u) => u.entityType === EntityType.TEMP_STATEMENT && u.entityId === tempStatementId,
                    )

                    if (statementUsage) {
                        await this.mediaUsageRepository.detach(statementUsage.usageId)
                    }

                    // 6.2 Check remaining usages
                    const remainingUsages = await this.mediaUsageRepository.findByMedia(mediaId)

                    // If no more usages, soft delete the media
                    if (remainingUsages.length === 0) {
                        await this.mediaRepository.softDelete(mediaId)
                    }
                } catch (err) {
                    console.error(`Failed to detach/delete media ${mediaId}`, err)
                }
            }),
        )

        /* ------------------------------------------------------------------
         * 7. Update TempStatement with normalized content
         * ------------------------------------------------------------------ */
        const updated = await this.tempStatementRepository.update(tempStatementId, {
            content: normalizedContent,
            isCorrect: dto.isCorrect,
            difficulty: dto.difficulty,
            metadata: dto.metadata,
        })

        /* ------------------------------------------------------------------
         * 8. Response
         * ------------------------------------------------------------------ */
        return {
            success: true,
            message: 'Cập nhật đáp án tạm thời thành công',
            data: TempStatementResponseDto.fromEntity(updated),
        }
    }
}
