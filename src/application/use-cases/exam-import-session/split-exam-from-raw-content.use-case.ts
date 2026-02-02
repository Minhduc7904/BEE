import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExamSplitService } from '../../../infrastructure/services/exam-split.service'
import { SplitExamResponseDto } from '../../dtos/exam-import-session/split-exam-response.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import type { IAdminAuditLogRepository, IExamImportSessionRepository } from 'src/domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { SaveSplitResultToTempUseCase } from './save-split-result-to-temp.use-case'

/**
 * Use case: Tách câu hỏi từ rawContent do người dùng truyền vào
 * Lưu kết quả vào session hiện tại (không tạo session mới)
 */
@Injectable()
export class SplitExamFromRawContentUseCase {
    constructor(
        private readonly examSplitService: ExamSplitService,
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
        @Inject('IExamImportSessionRepository')
        private readonly sessionRepository: IExamImportSessionRepository,
        private readonly saveSplitResultToTempUseCase: SaveSplitResultToTempUseCase,
        private readonly configService: ConfigService,
    ) { }

    async execute(sessionId: number, rawContent: string, adminId: number, userId: number): Promise<BaseResponseDto<SplitExamResponseDto>> {
        const startTime = Date.now()

        try {
            // Kiểm tra session tồn tại
            const session = await this.sessionRepository.findById(sessionId)
            if (!session) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_RAW_CONTENT,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: `Session ${sessionId} không tồn tại`,
                })
                throw new Error(`Session ${sessionId} không tồn tại`)
            }

            // Kiểm tra quyền
            if (session.createdBy !== adminId) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_RAW_CONTENT,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: 'Bạn không có quyền truy cập session này',
                })
                throw new Error('Bạn không có quyền truy cập session này')
            }

            // Validate rawContent không được rỗng
            if (!rawContent || rawContent.trim().length === 0) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_RAW_CONTENT,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    errorMessage: 'Nội dung không được để trống',
                })
                throw new Error('Nội dung không được để trống')
            }

            // Validate độ dài rawContent (tối đa từ config)
            const MAX_CONTENT_LENGTH = this.configService.get<number>('examSplit.maxContentLength', 15000)
            if (rawContent.length > MAX_CONTENT_LENGTH) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_RAW_CONTENT,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    errorMessage: `Nội dung quá dài (${rawContent.length} ký tự). Tối đa ${MAX_CONTENT_LENGTH} ký tự`,
                    afterData: {
                        contentLength: rawContent.length,
                        maxLength: MAX_CONTENT_LENGTH,
                    },
                })
                throw new Error(`Nội dung quá dài (${rawContent.length} ký tự). Tối đa ${MAX_CONTENT_LENGTH} ký tự`)
            }

            // Gọi ExamSplitService
            const result = await this.examSplitService.splitExam(rawContent)

            // Lưu kết quả vào TempQuestion và TempStatement
            const saveResult = await this.saveSplitResultToTempUseCase.execute(
                sessionId,
                result.questions,
                adminId,
                userId
            )

            console.log('SplitExamFromRawContentUseCase - Saved split result:', saveResult)

            const processingTimeMs = Date.now() - startTime

            // Ghi log thành công với thông tin token usage
            await this.auditLogRepository.create({
                adminId: adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_RAW_CONTENT,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId.toString(),
                afterData: {
                    totalQuestions: result.questions.length,
                    savedQuestions: saveResult.data?.savedQuestions || 0,
                    savedStatements: saveResult.data?.savedStatements || 0,
                    processingTimeMs,
                    tokenUsage: result.usage || null,
                    contentLength: rawContent.length,
                },
            })

            return {
                success: true,
                message: `Tách và lưu câu hỏi thành công: ${saveResult.data?.savedQuestions || 0} câu hỏi, ${saveResult.data?.savedStatements || 0} đáp án`,
                data: {
                    questions: result.questions,
                    totalQuestions: result.questions.length,
                    processingTimeMs,
                },
            }
        } catch (error: any) {
            // Ghi log lỗi
            await this.auditLogRepository.create({
                adminId: adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_RAW_CONTENT,
                status: AuditStatus.FAIL,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId?.toString(),
                errorMessage: error.message,
                afterData: {
                    contentLength: rawContent?.length || 0,
                },
            })
            throw error
        }
    }
}
