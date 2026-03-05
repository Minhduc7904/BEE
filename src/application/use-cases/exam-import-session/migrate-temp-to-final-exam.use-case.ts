import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import type { IExamImportSessionRepository } from 'src/domain/repositories/exam-import-session.repository'
import type { IAdminAuditLogRepository } from 'src/domain/repositories/admin-audit-log.repository'
import type { IMediaUsageRepository } from 'src/domain/repositories/media-usage.repository'
import type { IUnitOfWork } from 'src/domain/repositories/unit-of-work.repository'
import type { IExamRepository } from 'src/domain/repositories/exam.repository'
import type { ISectionRepository } from 'src/domain/repositories/section.repository'
import type { IQuestionRepository } from 'src/domain/repositories/question.repository'
import type { IStatementRepository } from 'src/domain/repositories/statement.repository'
import type { IQuestionExamRepository } from 'src/domain/repositories/question-exam.repository'
import type { IQuestionChapterRepository } from 'src/domain/repositories/question-chapter.repository'
import type { ITempExamRepository } from 'src/domain/repositories/temp-exam.repository'
import type { ITempSectionRepository } from 'src/domain/repositories/temp-section.repository'
import type { ITempQuestionRepository } from 'src/domain/repositories/temp-question.repository'
import type { ITempStatementRepository } from 'src/domain/repositories/temp-statement.repository'
import { PrismaService } from 'src/prisma/prisma.service'
import { ImportStatus } from 'src/shared/enums/import-status.enum'
import { Visibility } from 'src/shared/enums/visibility.enum'
import { ExamVisibility } from 'src/shared/enums/exam-visibility.enum'
import { Difficulty } from 'src/shared/enums/difficulty.enum'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { MediaVisibility } from 'src/shared/enums/media-visibility.enum'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { TEMP_EXAM_TO_EXAM_FIELD_MAP } from 'src/shared/constants/media-field-name.constants'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'
import { DEFAULT_QUESTION_POINTS } from 'src/shared/constants/grading-rules.constants'

interface MigrateTempToFinalExamParams {
    sessionId: number
    adminId: number
}

interface MigrateTempToFinalExamResult {
    examId: number
    totalSections: number
    totalQuestions: number
    totalStatements: number
    totalChapters: number
}

interface MediaMigrationTask {
    tempEntityType: string
    tempEntityId: number
    finalEntityType: string
    finalEntityId: number
    visibility: string
    adminId: number
}

@Injectable()
export class MigrateTempToFinalExamUseCase {
    constructor(
        @Inject('IExamImportSessionRepository')
        private readonly sessionRepository: IExamImportSessionRepository,
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        @Inject('IExamRepository')
        private readonly examRepository: IExamRepository,
        @Inject('ISectionRepository')
        private readonly sectionRepository: ISectionRepository,
        @Inject('IQuestionRepository')
        private readonly questionRepository: IQuestionRepository,
        @Inject('IStatementRepository')
        private readonly statementRepository: IStatementRepository,
        @Inject('IQuestionExamRepository')
        private readonly questionExamRepository: IQuestionExamRepository,
        @Inject('IQuestionChapterRepository')
        private readonly questionChapterRepository: IQuestionChapterRepository,
        @Inject('ITempExamRepository')
        private readonly tempExamRepository: ITempExamRepository,
        @Inject('ITempSectionRepository')
        private readonly tempSectionRepository: ITempSectionRepository,
        @Inject('ITempQuestionRepository')
        private readonly tempQuestionRepository: ITempQuestionRepository,
        @Inject('ITempStatementRepository')
        private readonly tempStatementRepository: ITempStatementRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(params: MigrateTempToFinalExamParams): Promise<BaseResponseDto<MigrateTempToFinalExamResult>> {
        const { sessionId, adminId } = params

        // 1. Validate session exists and belongs to admin
        const session = await this.sessionRepository.findById(sessionId)
        if (!session) {
            throw new NotFoundException('Session not found')
        }

        if (session.createdBy !== adminId) {
            throw new BadRequestException('You can only migrate your own sessions')
        }

        // 2. Validate session status (can only migrate PENDING, REVIEWING, or APPROVED)
        if (session.status === ImportStatus.COMPLETED) {
            throw new BadRequestException('Session has already been migrated')
        }

        if (session.status === ImportStatus.FAILED || session.status === ImportStatus.REJECTED) {
            throw new BadRequestException(`Cannot migrate session with status: ${session.status}`)
        }

        if (session.status === ImportStatus.MIGRATING) {
            throw new BadRequestException('Session is already being migrated')
        }

        // 3. Set status to MIGRATING before starting
        await this.sessionRepository.updateStatus(sessionId, ImportStatus.MIGRATING)

        try {
            // 4. Execute migration in transaction
            // Collect media migration tasks to process AFTER transaction commits
            const mediaMigrationTasks: MediaMigrationTask[] = []

            const result = await this.unitOfWork.executeInTransaction(async (repos) => {
                const txClient = (repos.tempExamRepository as any).prisma

                // 4.1. Get Session with TempExam and all relations (sections, questions, statements, QuestionChapters)
                // Schema: ExamImportSession có relation trực tiếp với tempExam, tempSections[], tempQuestions[]
                // NOTE: TempQuestion.tempSectionId nullable => có thể có câu hỏi không thuộc section nào
                const sessionWithExam = await txClient.examImportSession.findUnique({
                    where: { sessionId },
                    include: {
                        tempExam: true,
                        tempSections: {
                            include: {
                                tempQuestions: {
                                    include: {
                                        tempStatements: {
                                            orderBy: { order: 'asc' },
                                        },
                                        tempQuestionChapters: {
                                            include: {
                                                chapter: true,
                                            },
                                        },
                                    },
                                    orderBy: { order: 'asc' },
                                },
                            },
                            orderBy: { order: 'asc' },
                        },
                        // Include TẤT CẢ tempQuestions của session (bao gồm cả những câu không có tempSectionId)
                        tempQuestions: {
                            include: {
                                tempStatements: {
                                    orderBy: { order: 'asc' },
                                },
                                tempQuestionChapters: {
                                    include: {
                                        chapter: true,
                                    },
                                },
                            },
                            orderBy: { order: 'asc' },
                        },
                    },
                })

                if (!sessionWithExam || !sessionWithExam.tempExam) {
                    throw new NotFoundException('TempExam not found for this session')
                }

                const tempExam = sessionWithExam.tempExam
                // Gán tempSections từ session vào tempExam để giữ nguyên logic migration
                tempExam.tempSections = sessionWithExam.tempSections

                // Xử lý các câu hỏi không thuộc section nào
                // Explicit exclude: lấy Set của questionId đã nằm trong sections
                const sectionQuestionIds = new Set(
                    sessionWithExam.tempSections.flatMap(s => s.tempQuestions.map(q => q.tempQuestionId))
                )
                // Filter những câu không nằm trong bất kỳ section nào
                const questionsWithoutSection = sessionWithExam.tempQuestions.filter(
                    q => !sectionQuestionIds.has(q.tempQuestionId)
                )
                if (questionsWithoutSection.length > 0) {
                    // console.log(`Found ${questionsWithoutSection.length} orphan questions (not in any section) in sessionId=${sessionId}`)
                }

                // Check if already migrated
                if (tempExam.examId) {
                    throw new BadRequestException('TempExam has already been migrated')
                }

                // Validate exam has subjectId
                if (!tempExam.subjectId) {
                    throw new BadRequestException('Exam chưa có môn học. Vui lòng cập nhật môn học trước khi migrate.')
                }

                // 4.2. Create Exam using repository
                const exam = await repos.examRepository.create({
                    title: tempExam.title,
                    description: tempExam.description,
                    grade: tempExam.grade || 12,
                    visibility: tempExam.visibility,
                    solutionYoutubeUrl: tempExam.solutionYoutubeUrl,
                    adminId,
                    subjectId: tempExam.subjectId,
                }, txClient)

                // 4.2.1. Collect media migration task for Exam (process after transaction)
                mediaMigrationTasks.push({
                    tempEntityType: EntityType.TEMP_EXAM,
                    tempEntityId: tempExam.tempExamId,
                    finalEntityType: EntityType.EXAM,
                    finalEntityId: exam.examId,
                    visibility: exam.visibility,
                    adminId,
                })

                // 4.3. Migrate Sections with Questions
                let totalQuestions = 0
                let totalStatements = 0
                let totalChapters = 0

                for (const tempSection of tempExam.tempSections) {
                    // Create Section
                    const section = await this.createSection(repos, txClient, exam.examId, tempSection)

                    // Migrate Questions in this section
                    const { questions, statements, chapters } = await this.migrateQuestionsForSection(
                        repos,
                        txClient,
                        exam.examId,
                        section.sectionId,
                        tempSection.tempQuestions,
                        adminId,
                        mediaMigrationTasks,
                    )

                    totalQuestions += questions
                    totalStatements += statements
                    totalChapters += chapters
                }

                // 4.3.1. Migrate orphan questions (questions without section)
                // These questions will be linked to Exam with sectionId=null
                if (questionsWithoutSection.length > 0) {
                    // console.log(`Migrating ${questionsWithoutSection.length} orphan questions without section...`)
                    const { questions, statements, chapters } = await this.migrateQuestionsForSection(
                        repos,
                        txClient,
                        exam.examId,
                        null, // sectionId = null for orphan questions
                        questionsWithoutSection,
                        adminId,
                        mediaMigrationTasks,
                    )
                    totalQuestions += questions
                    totalStatements += statements
                    totalChapters += chapters
                }

                // 4.4. Update TempExam with examId using repository
                await repos.tempExamRepository.linkToFinalExam(tempExam.tempExamId, exam.examId)

                // 4.5. Update Session status to COMPLETED
                await txClient.examImportSession.update({
                    where: { sessionId },
                    data: {
                        status: ImportStatus.COMPLETED,
                        completedAt: new Date(),
                        approvedBy: adminId,
                        approvedAt: new Date(),
                    },
                })

                return {
                    examId: exam.examId,
                    totalSections: tempExam.tempSections.length,
                    totalQuestions,
                    totalStatements,
                    totalChapters,
                }
            })

            // 5. Process media migrations AFTER transaction committed (non-blocking)
            // Media is metadata - failures here should not block migration
            await this.processMediaMigrations(mediaMigrationTasks).catch((error) => {
                console.error('Media migration failed (non-blocking):', error.message)
            })

            // 6. Log audit
            await this.auditLogRepository.create({
                adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.MIGRATE,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId.toString(),
                afterData: result,
            })

            return BaseResponseDto.success('Migration completed successfully', result)
        } catch (error) {
            // Revert status to REVIEWING if migration fails
            await this.sessionRepository.updateStatus(sessionId, ImportStatus.REVIEWING)

            // Log failed audit
            await this.auditLogRepository.create({
                adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.MIGRATE,
                status: AuditStatus.FAIL,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId.toString(),
                errorMessage: error.message,
            })

            throw error
        }
    }

    /**
     * Create section and link to temp section
     */
    private async createSection(repos: any, txClient: any, examId: number, tempSection: any) {
        const section = await repos.sectionRepository.create({
            examId,
            title: tempSection.title,
            description: tempSection.description,
            order: tempSection.order,
        }, txClient)

        // Update TempSection with sectionId using repository
        await repos.tempSectionRepository.linkToFinalSection(tempSection.tempSectionId, section.sectionId)

        return section
    }

    /**
     * Migrate all questions in a section with optimized bulk operations
     * CRITICAL: Backfills TempStatement.statementId after bulk insert
     * @param sectionId - Section ID, or null for orphan questions (questions without section)
     */
    private async migrateQuestionsForSection(
        repos: any,
        txClient: any,
        examId: number,
        sectionId: number | null,
        tempQuestions: any[],
        adminId: number,
        mediaMigrationTasks: MediaMigrationTask[],
    ) {
        let totalStatements = 0
        let totalChapters = 0

        // Prepare batch data for bulk inserts
        const questionExamBatch: any[] = []
        const statementBatch: any[] = []
        const chapterBatch: any[] = []
        const tempQuestionUpdates: any[] = []
        // Track mapping for statement backfill: tempStatementId -> (questionId, order)
        const tempStatementMapping: Array<{ tempStatementId: number; questionId: number; order: number }> = []

        for (const tempQuestion of tempQuestions) {
            // Validate question has subjectId
            if (!tempQuestion.subjectId) {
                throw new BadRequestException(
                    `Câu hỏi thứ ${tempQuestion.order || 'N/A'} chưa có môn học. Vui lòng cập nhật môn học trước khi migrate.`
                )
            }

            // Generate slug and searchableContent from TempQuestion
            // Use tempQuestion's values if available, otherwise generate from content
            const content = tempQuestion.content || ''
            const searchableContent = tempQuestion.searchableContent || TextSearchUtil.stripMarkdownForSearch(content)
            
            // Generate slug: use tempQuestion.slug if exists, otherwise generate from content
            let slug: string
            if (tempQuestion.slug) {
                slug = tempQuestion.slug
            } else {
                // Generate slug from first 100 chars of searchable content
                const contentPreview = searchableContent.substring(0, 100)
                const baseSlug = TextSearchUtil.generateSlug(contentPreview)
                slug = TextSearchUtil.generateUniqueSlug(baseSlug)
            }

            // Nếu không có pointsOrigin, tự động lấy từ DEFAULT_QUESTION_POINTS theo loại câu hỏi
            const pointsOrigin = tempQuestion.pointsOrigin
                ?? DEFAULT_QUESTION_POINTS[tempQuestion.type]
                ?? null

            // Create Question using repository
            const question = await repos.questionRepository.create({
                content,
                slug,
                searchableContent,
                type: tempQuestion.type,
                correctAnswer: tempQuestion.correctAnswer,
                solution: tempQuestion.solution,
                difficulty: tempQuestion.difficulty || null, // AI có thể không phân loại được
                solutionYoutubeUrl: tempQuestion.solutionYoutubeUrl,
                grade: tempQuestion.grade || tempQuestion.tempExam?.grade || null,
                subjectId: tempQuestion.subjectId,
                pointsOrigin: pointsOrigin,
                visibility: Visibility.PUBLISHED,
                createdBy: adminId,
            }, txClient)

            // Collect media migration task for question (process after transaction)
            mediaMigrationTasks.push({
                tempEntityType: EntityType.TEMP_QUESTION,
                tempEntityId: tempQuestion.tempQuestionId,
                finalEntityType: EntityType.EXAM,
                finalEntityId: question.questionId,
                visibility: question.visibility,
                adminId,
            })

            // Prepare QuestionExam junction
            questionExamBatch.push({
                questionId: question.questionId,
                examId,
                sectionId,
                order: tempQuestion.order,
                points: pointsOrigin,
            })

            // Prepare Statements for bulk insert
            for (const tempStatement of tempQuestion.tempStatements) {
                statementBatch.push({
                    content: tempStatement.content,
                    questionId: question.questionId,
                    isCorrect: tempStatement.isCorrect,
                    order: tempStatement.order,
                    difficulty: tempStatement.difficulty,
                })

                // Track for backfill: tempStatementId -> (questionId, order)
                tempStatementMapping.push({
                    tempStatementId: tempStatement.tempStatementId,
                    questionId: question.questionId,
                    order: tempStatement.order,
                })

                // Collect media migration task for statement (process after transaction)
                mediaMigrationTasks.push({
                    tempEntityType: EntityType.TEMP_STATEMENT,
                    tempEntityId: tempStatement.tempStatementId,
                    finalEntityType: EntityType.EXAM,
                    finalEntityId: 0, // Will be backfilled after statement insert
                    visibility: Visibility.PUBLISHED,
                    adminId,
                })

                totalStatements++
            }

            // Prepare QuestionChapters for bulk insert (AI metadata - non-blocking)
            for (const tempQuestionChapter of tempQuestion.tempQuestionChapters) {
                if (tempQuestionChapter.chapterId) {
                    chapterBatch.push({
                        questionId: question.questionId,
                        chapterId: tempQuestionChapter.chapterId,
                    })
                    totalChapters++
                }
            }

            // Prepare TempQuestion update
            tempQuestionUpdates.push({
                tempQuestionId: tempQuestion.tempQuestionId,
                questionId: question.questionId,
            })
        }

        // Bulk insert QuestionExam junctions using repository
        if (questionExamBatch.length > 0) {
            await repos.questionExamRepository.createMany(questionExamBatch, txClient)
        }

        // Bulk insert Statements using repository
        if (statementBatch.length > 0) {
            await repos.statementRepository.createMany(statementBatch, txClient)

            // CRITICAL: Backfill TempStatement.statementId
            // Load ALL statements for this section in ONE query (avoid N+1)
            const allQuestionIds = tempQuestionUpdates.map((u) => u.questionId)
            const allStatements = await repos.statementRepository.findByQuestionIds(allQuestionIds, txClient)

            // Build map: "questionId:order" -> statementId
            const statementMap = new Map<string, number>()
            for (const stmt of allStatements) {
                const key = `${stmt.questionId}:${stmt.order}`
                statementMap.set(key, stmt.statementId)
            }

            // Backfill TempStatement.statementId and update media task finalEntityId
            for (const mapping of tempStatementMapping) {
                const key = `${mapping.questionId}:${mapping.order}`
                const statementId = statementMap.get(key)

                if (statementId) {
                    // Update TempStatement with statementId (REQUIRED) using repository
                    await repos.tempStatementRepository.linkToFinalStatement(mapping.tempStatementId, statementId)

                    // Update media migration task with correct finalEntityId
                    const mediaTask = mediaMigrationTasks.find(
                        (t) =>
                            t.tempEntityType === EntityType.TEMP_STATEMENT &&
                            t.tempEntityId === mapping.tempStatementId,
                    )
                    if (mediaTask) {
                        mediaTask.finalEntityId = statementId
                    }
                }
            }
        }

        // Bulk insert QuestionChapters (non-critical, skip if empty) using repository
        if (chapterBatch.length > 0) {
            try {
                await repos.questionChapterRepository.createMany(chapterBatch, txClient)
            } catch (error) {
                // Log warning but don't fail migration
                console.warn('Failed to insert some chapters:', error.message)
            }
        }

        // Update TempQuestions with questionId using repository
        for (const update of tempQuestionUpdates) {
            await repos.tempQuestionRepository.linkToFinalQuestion(update.tempQuestionId, update.questionId)
        }

        return {
            questions: tempQuestions.length,
            statements: totalStatements,
            chapters: totalChapters,
        }
    }

    /**
     * Process all media migrations AFTER transaction commits
     * Media is metadata - failures should not block exam migration
     */
    private async processMediaMigrations(tasks: MediaMigrationTask[]) {
        for (const task of tasks) {
            try {
                // Skip if finalEntityId not set (shouldn't happen if backfill worked)
                if (!task.finalEntityId) {
                    console.warn(`Skipping media migration for ${task.tempEntityType}:${task.tempEntityId} - no finalEntityId`)
                    continue
                }

                if (task.tempEntityType === EntityType.TEMP_EXAM) {
                    await this.migrateMediaUsages(
                        task.tempEntityId,
                        task.finalEntityId,
                        task.visibility,
                        task.adminId,
                    )
                } else if (task.tempEntityType === EntityType.TEMP_QUESTION) {
                    await this.migrateQuestionMediaUsages(
                        task.tempEntityId,
                        task.finalEntityId,
                        task.visibility,
                        task.adminId,
                    )
                } else if (task.tempEntityType === EntityType.TEMP_STATEMENT) {
                    await this.migrateStatementMediaUsages(
                        task.tempEntityId,
                        task.finalEntityId,
                        task.visibility,
                        task.adminId,
                    )
                }
            } catch (error) {
                // Log but don't fail - media is non-critical metadata
                console.error(`Media migration failed for ${task.tempEntityType}:${task.tempEntityId}:`, error.message)
            }
        }
    }

    /**
     * Migrate media usages from TempExam to Exam
     * Maps field names and updates visibility based on exam visibility
     */
    private async migrateMediaUsages(
        tempExamId: number,
        examId: number,
        examVisibility: string,
        adminId: number,
    ) {
        // Get all media usages for TempExam
        const tempMediaUsages = await this.mediaUsageRepository.findByEntity(
            EntityType.TEMP_EXAM,
            tempExamId,
        )

        if (tempMediaUsages.length === 0) {
            return
        }

        // Determine media visibility based on exam visibility
        const mediaVisibility = this.getMediaVisibility(examVisibility)

        // Field name mapping from TEMP_* to final entity fields
        const fieldNameMap = TEMP_EXAM_TO_EXAM_FIELD_MAP

        // Create new media usages for the final Exam
        for (const tempUsage of tempMediaUsages) {
            // Map field name from TEMP_* to final field name
            const newFieldName = tempUsage.fieldName ? (fieldNameMap[tempUsage.fieldName] || tempUsage.fieldName) : null

            await this.mediaUsageRepository.attach({
                mediaId: tempUsage.mediaId,
                entityType: EntityType.EXAM,
                entityId: examId,
                fieldName: newFieldName ?? undefined,
                usedBy: adminId,
                visibility: mediaVisibility,
            })
        }
    }

    /**
     * Migrate media usages from TempQuestion to Question
     */
    private async migrateQuestionMediaUsages(
        tempQuestionId: number,
        questionId: number,
        questionVisibility: string,
        adminId: number,
    ) {
        const tempMediaUsages = await this.mediaUsageRepository.findByEntity(
            EntityType.TEMP_QUESTION,
            tempQuestionId,
        )

        if (tempMediaUsages.length === 0) {
            return
        }

        const mediaVisibility = this.getMediaVisibility(questionVisibility)

        // TempQuestion media usages don't have fieldName, copy media directly
        for (const tempUsage of tempMediaUsages) {
            await this.mediaUsageRepository.attach({
                mediaId: tempUsage.mediaId,
                entityType: EntityType.QUESTION, // Questions use QUESTION entity type
                entityId: questionId,
                fieldName: tempUsage.fieldName ?? undefined,
                usedBy: adminId,
                visibility: mediaVisibility,
            })
        }
    }

    /**
     * Migrate media usages from TempStatement to Statement
     */
    private async migrateStatementMediaUsages(
        tempStatementId: number,
        statementId: number,
        statementVisibility: string,
        adminId: number,
    ) {
        const tempMediaUsages = await this.mediaUsageRepository.findByEntity(
            EntityType.TEMP_STATEMENT,
            tempStatementId,
        )

        if (tempMediaUsages.length === 0) {
            return
        }

        const mediaVisibility = this.getMediaVisibility(statementVisibility)

        // TempStatement media usages don't have fieldName, copy media directly
        for (const tempUsage of tempMediaUsages) {
            await this.mediaUsageRepository.attach({
                mediaId: tempUsage.mediaId,
                entityType: EntityType.STATEMENT, // Statements use STATEMENT entity type
                entityId: statementId,
                fieldName: tempUsage.fieldName ?? undefined,
                usedBy: adminId,
                visibility: mediaVisibility,
            })
        }
    }

    /**
     * Convert exam visibility to media visibility
     */
    private getMediaVisibility(examVisibility: string): MediaVisibility {
        switch (examVisibility) {
            case ExamVisibility.PUBLISHED:
                return MediaVisibility.PUBLIC
            case ExamVisibility.DRAFT:
            case ExamVisibility.PRIVATE:
            case ExamVisibility.ARCHIVED:
            default:
                return MediaVisibility.PRIVATE
        }
    }
}
