import { Injectable, NotFoundException } from '@nestjs/common'
import type { IExamImportSessionRepository, IAdminAuditLogRepository } from 'src/domain/repositories'
import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExamSplitService } from '../../../infrastructure/services/exam-split.service'
import { SplitExamResponseDto } from '../../dtos/exam-import-session/split-exam-response.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { SaveSplitResultToTempUseCase } from './save-split-result-to-temp.use-case'

/**
 * Use case: Tách câu hỏi từ rawContent của session
 * Lấy rawContent từ database và gửi cho ExamSplitService
 * Sau khi tách thành công, tự động lưu vào TempQuestion và TempStatement
 */
@Injectable()
export class SplitExamFromSessionUseCase {
    constructor(
        @Inject('IExamImportSessionRepository')
        private readonly sessionRepository: IExamImportSessionRepository,
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
        private readonly examSplitService: ExamSplitService,
        private readonly saveSplitResultToTempUseCase: SaveSplitResultToTempUseCase,
        private readonly configService: ConfigService,
    ) { }

    async execute(sessionId: number, adminId: number, userId: number): Promise<BaseResponseDto<SplitExamResponseDto>> {
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

            // Kiểm tra quyền (chỉ người tạo mới được tách)
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

            // Kiểm tra có rawContent
            if (!session.rawContent) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: 'Session chưa có rawContent',
                })
                throw new Error('Session chưa có rawContent')
            }

            // Validate độ dài rawContent (tối đa từ config)
            const MAX_CONTENT_LENGTH = this.configService.get<number>('examSplit.maxContentLength', 15000)
            if (session.rawContent.length > MAX_CONTENT_LENGTH) {
                await this.auditLogRepository.create({
                    adminId: adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: `Nội dung quá dài (${session.rawContent.length} ký tự). Tối đa ${MAX_CONTENT_LENGTH} ký tự`,
                    afterData: {
                        contentLength: session.rawContent.length,
                        maxLength: MAX_CONTENT_LENGTH,
                    },
                })
                throw new Error(`Nội dung quá dài (${session.rawContent.length} ký tự). Tối đa ${MAX_CONTENT_LENGTH} ký tự`)
            }

            // Gọi ExamSplitService
            const result = await this.examSplitService.splitExam(session.rawContent)

            // Lưu kết quả vào TempQuestion và TempStatement
            const saveResult = await this.saveSplitResultToTempUseCase.execute(
                sessionId,
                result.questions,
                adminId,
                userId
            )

            const processingTimeMs = Date.now() - startTime

            // Ghi log thành công với thông tin token usage
            await this.auditLogRepository.create({
                adminId: adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.SPLIT_FROM_SESSION,
                status: AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId.toString(),
                afterData: {
                    totalQuestions: result.questions.length,
                    savedQuestions: saveResult.data?.savedQuestions || 0,
                    savedStatements: saveResult.data?.savedStatements || 0,
                    processingTimeMs,
                    tokenUsage: result.usage || null,
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
            // Nếu chưa có log lỗi (các lỗi chưa được catch ở trên)
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
