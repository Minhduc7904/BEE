// src/application/use-cases/temp-statement/create-temp-statement.use-case.ts
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
    ITempQuestionRepository,
} from '../../../domain/repositories/temp-question.repository'
import type {
    ITempStatementRepository,
} from '../../../domain/repositories/temp-statement.repository'
import {
    CreateTempStatementDto,
    TempStatementResponseDto,
} from '../../dtos/temp-statement'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from '../../../shared/constants/entity-type.constants'
import {
    extractAllMediaIds,
    normalizeMediaMarkdown,
} from '../../../shared/utils'

@Injectable()
export class CreateTempStatementUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,

        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
    ) { }

    async execute(
        tempQuestionId: number,
        dto: CreateTempStatementDto,
        userId: number,
    ): Promise<BaseResponseDto<TempStatementResponseDto>> {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempQuestionRepository: ITempQuestionRepository =
                repos.tempQuestionRepository
            const tempStatementRepository: ITempStatementRepository =
                repos.tempStatementRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            /* ------------------------------------------------------------------
             * 1. Check TempQuestion exists
             * ------------------------------------------------------------------ */
            const tempQuestion = await tempQuestionRepository.findById(tempQuestionId)
            if (!tempQuestion) {
                throw new NotFoundException(
                    `TempQuestion ${tempQuestionId} không tồn tại`,
                )
            }

            /* ------------------------------------------------------------------
             * 2. Normalize markdown
             * ------------------------------------------------------------------ */
            const normalizedContent = normalizeMediaMarkdown(dto.content)

            /* ------------------------------------------------------------------
             * 3. Calculate order (max order + 1)
             * ------------------------------------------------------------------ */
            const existingStatements = await tempStatementRepository.findByTempQuestionId(tempQuestionId)
            
            let newOrder = 1
            if (existingStatements.length > 0) {
                const maxOrder = Math.max(
                    ...existingStatements
                        .filter(s => s.order !== null && s.order !== undefined)
                        .map(s => s.order!)
                )
                newOrder = maxOrder + 1
            }

            /* ------------------------------------------------------------------
             * 4. Create TempStatement
             * ------------------------------------------------------------------ */
            const tempStatement = await tempStatementRepository.create({
                tempQuestionId,
                content: normalizedContent,
                isCorrect: dto.isCorrect,
                order: newOrder,
                difficulty: dto.difficulty,
                metadata: dto.metadata,
            })

            /* ------------------------------------------------------------------
             * 5. Extract and attach media
             * ------------------------------------------------------------------ */
            const mediaIds = extractAllMediaIds(normalizedContent)

            await Promise.all(
                Array.from(mediaIds).map(async (mediaId) => {
                    try {
                        const media = await this.mediaRepository.findById(mediaId)
                        if (!media) return

                        const exists = await mediaUsageRepository.exists(
                            mediaId,
                            EntityType.TEMP_STATEMENT,
                            tempStatement.tempStatementId,
                        )

                        if (!exists) {
                            await mediaUsageRepository.attach({
                                mediaId,
                                entityType: EntityType.TEMP_STATEMENT,
                                entityId: tempStatement.tempStatementId,
                                usedBy: userId,
                            })
                        }
                    } catch (err) {
                        console.error(`Failed to attach media ${mediaId}`, err)
                    }
                }),
            )

            /* ------------------------------------------------------------------
             * 6. Response
             * ------------------------------------------------------------------ */
            return {
                success: true,
                message: 'Tạo đáp án tạm thời thành công',
                data: TempStatementResponseDto.fromEntity(tempStatement),
            }
        })
    }
}
