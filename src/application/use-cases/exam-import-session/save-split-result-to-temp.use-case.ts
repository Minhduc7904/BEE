import {
    Injectable,
    Inject,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common'
import type {
    IUnitOfWork,
    IMediaRepository,
} from 'src/domain/repositories'
import { SplitQuestion } from '../../../infrastructure/services/exam-split.service'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { extractAllMediaIds } from '../../../shared/utils'
import { EntityType } from '../../../shared/constants/entity-type.constants'

@Injectable()
export class SaveSplitResultToTempUseCase {
    constructor(
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,

        @Inject('IMediaRepository')
        private readonly mediaRepository: IMediaRepository,
    ) { }

    async execute(
        sessionId: number,
        questions: SplitQuestion[],
        adminId: number,
        userId: number,
    ): Promise<
        BaseResponseDto<{
            savedQuestions: number
            savedStatements: number
        }>
    > {
        return this.unitOfWork.executeInTransaction(async (repos) => {
            const sessionRepository = repos.examImportSessionRepository
            const tempQuestionRepository = repos.tempQuestionRepository
            const tempStatementRepository = repos.tempStatementRepository
            const mediaUsageRepository = repos.mediaUsageRepository

            const session = await sessionRepository.findById(sessionId)
            if (!session) {
                throw new NotFoundException(`Session ${sessionId} không tồn tại`)
            }

            if (session.createdBy !== adminId) {
                throw new ForbiddenException('Bạn không có quyền truy cập session này')
            }

            const existingQuestions =
                await tempQuestionRepository.findBySessionId(sessionId)

            const maxOrder =
                existingQuestions.length > 0
                    ? Math.max(...existingQuestions.map((q) => q.order))
                    : 0

            let savedQuestions = 0
            let savedStatements = 0

            for (let i = 0; i < questions.length; i++) {
                const question = questions[i]
                const order = maxOrder + i + 1

                const tempQuestion = await tempQuestionRepository.create({
                    sessionId,
                    content: question.content,
                    type: question.type,
                    subjectId: question.subjectId || undefined,
                    correctAnswer: question.correctAnswer || undefined,
                    solution: question.solution || undefined,
                    difficulty: question.difficulty || undefined,
                    pointsOrigin: question.pointsOrigin || undefined,
                    order,
                    metadata: {
                        part: question.part,
                        originalOrder: question.order,
                    },
                })

                savedQuestions++

                // Attach media for question
                await this.attachMediaFromContents(
                    [question.content, question.solution],
                    EntityType.TEMP_QUESTION,
                    tempQuestion.tempQuestionId,
                    userId,
                    mediaUsageRepository,
                )

                // Statements
                if (question.statements?.length) {
                    for (let j = 0; j < question.statements.length; j++) {
                        const statement = question.statements[j]

                        const tempStatement =
                            await tempStatementRepository.create({
                                tempQuestionId:
                                    tempQuestion.tempQuestionId,
                                content: statement.content,
                                isCorrect: statement.isCorrect,
                                order: j + 1,
                                difficulty:
                                    statement.difficulty || undefined,
                            })

                        savedStatements++

                        await this.attachMediaFromContents(
                            [statement.content],
                            EntityType.TEMP_STATEMENT,
                            tempStatement.tempStatementId,
                            userId,
                            mediaUsageRepository,
                        )
                    }
                }
            }

            return {
                success: true,
                message: `Đã lưu ${savedQuestions} câu hỏi và ${savedStatements} đáp án vào bảng tạm`,
                data: {
                    savedQuestions,
                    savedStatements,
                },
            }
        })
    }

    /**
     * Extract mediaIds từ nhiều content và attach usage (batch-safe)
     */
    private async attachMediaFromContents(
        contents: Array<string | null | undefined>,
        entityType: EntityType,
        entityId: number,
        userId: number,
        mediaUsageRepository: any,
    ) {
        const mediaIds = new Set<number>()

        for (const content of contents) {
            if (!content) continue
            extractAllMediaIds(content).forEach((id) => mediaIds.add(id))
        }

        if (mediaIds.size === 0) return

        const ids = Array.from(mediaIds)

        const medias = await this.mediaRepository.findByIds(ids)
        const existingUsages =
            await mediaUsageRepository.findExistingByEntity(
                ids,
                entityType,
                entityId,
            )

        const existingMediaIds = new Set(
            existingUsages.map((u) => u.mediaId),
        )

        const attachTasks = medias
            .filter((m) => !existingMediaIds.has(m.mediaId))
            .map((media) =>
                mediaUsageRepository.attach({
                    mediaId: media.mediaId,
                    entityType,
                    entityId,
                    usedBy: userId,
                }),
            )

        await Promise.all(attachTasks)
    }
}
