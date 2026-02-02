import { Injectable, NotFoundException } from '@nestjs/common'
import type { IExamImportSessionRepository, IAdminAuditLogRepository, ITempQuestionRepository, ITempQuestionChapterRepository } from 'src/domain/repositories'
import { Inject } from '@nestjs/common'
import { QuestionChapterClassificationService, QuestionToClassify } from '../../../infrastructure/services/question-chapter-classification.service'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'

/**
 * Response DTO cho kết quả phân loại
 */
export interface ClassifyQuestionChaptersResponseDto {
    totalQuestions: number
    classifiedQuestions: number
    totalChapters: number
    processingTimeMs: number
}

/**
 * Use case: Phân loại chapters cho các câu hỏi của một session
 * Sử dụng AI để phân loại và lưu kết quả vào TempQuestionChapter
 */
@Injectable()
export class ClassifyQuestionChaptersUseCase {
    constructor(
        @Inject('IExamImportSessionRepository')
        private readonly sessionRepository: IExamImportSessionRepository,
        @Inject('ITempQuestionRepository')
        private readonly tempQuestionRepository: ITempQuestionRepository,
        @Inject('ITempQuestionChapterRepository')
        private readonly tempQuestionChapterRepository: ITempQuestionChapterRepository,
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
        private readonly classificationService: QuestionChapterClassificationService,
    ) { }

    async execute(sessionId: number, adminId: number): Promise<BaseResponseDto<ClassifyQuestionChaptersResponseDto>> {
        const startTime = Date.now()

        try {
            // Lấy session từ DB
            const session = await this.sessionRepository.findById(sessionId)

            if (!session) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: `Session ${sessionId} không tồn tại`,
                })
                throw new NotFoundException(`Session ${sessionId} không tồn tại`)
            }

            // Kiểm tra quyền (chỉ người tạo mới được phân loại)
            if (session.createdBy !== adminId) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: 'Bạn không có quyền truy cập session này',
                })
                throw new NotFoundException('Bạn không có quyền truy cập session này')
            }

            // Lấy danh sách TempQuestions của session
            const tempQuestions = await this.tempQuestionRepository.findBySessionId(sessionId)

            if (tempQuestions.length === 0) {
                return {
                    success: true,
                    message: 'Không có câu hỏi nào để phân loại',
                    data: {
                        totalQuestions: 0,
                        classifiedQuestions: 0,
                        totalChapters: 0,
                        processingTimeMs: Date.now() - startTime,
                    },
                }
            }

            // Convert sang QuestionToClassify[]
            const questionsToClassify: QuestionToClassify[] = tempQuestions.map(q => ({
                questionId: q.tempQuestionId,
                subjectId: q.subjectId || null,
                content: q.content,
                statements: q.tempStatements?.map(s => ({
                    content: s.content,
                })) || [],
            }))

            // Gọi AI classification service
            const classificationResult = await this.classificationService.classifyQuestions(questionsToClassify)

            // Lưu kết quả vào database
            let totalChapters = 0
            let questionsWithGrade = 0
            let questionsWithDifficulty = 0

            for (const mapping of classificationResult.mappings) {
                // Cập nhật grade cho TempQuestion nếu AI phân loại được
                if (mapping.grade !== null && mapping.grade !== undefined) {
                    await this.tempQuestionRepository.updateGrade(mapping.questionId, mapping.grade)
                    questionsWithGrade++
                }

                // Cập nhật difficulty cho TempQuestion nếu AI phân loại được
                if (mapping.difficulty !== null && mapping.difficulty !== undefined) {
                    await this.tempQuestionRepository.updateDifficulty(mapping.questionId, mapping.difficulty)
                    questionsWithDifficulty++
                }

                // Lưu chapter mappings
                if (mapping.chapterIds.length === 0) continue

                // Xóa các mapping cũ
                await this.tempQuestionChapterRepository.deleteByTempQuestionId(mapping.questionId)

                // Tạo mapping mới (skipDuplicates đã được handle trong repository)
                await this.tempQuestionChapterRepository.createMany(
                    mapping.chapterIds.map(chapterId => ({
                        tempQuestionId: mapping.questionId,
                        chapterId,
                    }))
                )

                totalChapters += mapping.chapterIds.length
            }

            const classifiedQuestions = classificationResult.mappings.filter(m => m.chapterIds.length > 0).length
            const processingTimeMs = Date.now() - startTime

            // Ghi log thành công
            await this.auditLogRepository.create({
                adminId: adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId.toString(),
                afterData: {
                    totalQuestions: tempQuestions.length,
                    classifiedQuestions,
                    questionsWithGrade,
                    questionsWithDifficulty,
                    totalChapters,
                    processingTimeMs,
                    tokenUsage: classificationResult.usage || null,
                },
            })

            return {
                success: true,
                message: `Phân loại thành công ${classifiedQuestions}/${tempQuestions.length} câu hỏi với ${totalChapters} chương, ${questionsWithGrade} câu có grade, ${questionsWithDifficulty} câu có difficulty`,
                data: {
                    totalQuestions: tempQuestions.length,
                    classifiedQuestions,
                    totalChapters,
                    processingTimeMs,
                },
            }
        } catch (error: any) {
            // Ghi log lỗi
            if (!(error instanceof NotFoundException)) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: error.message,
                })
            }
            throw error
        }
    }
}
