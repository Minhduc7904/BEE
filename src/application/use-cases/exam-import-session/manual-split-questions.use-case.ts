// src/application/use-cases/exam-import-session/manual-split-questions.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IAdminAuditLogRepository, IExamImportSessionRepository, ITempExamRepository, IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ManualSplitQuestionsDto } from '../../dtos/exam-import-session/manual-split-questions.dto'
import {
    ManualSplitQuestionsResponseDto,
    ManualSplitQuestionItemDto,
    ParseErrorItemDto,
} from '../../dtos/exam-import-session/manual-split-questions-response.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import { QuestionType } from '../../../shared/enums/question-type.enum'
import { TempSection } from '../../../domain/entities/exam-import/temp-section.entity'
import { SplitQuestion } from '../../../infrastructure/services/exam-split.service'
import { SaveSplitResultToTempUseCase } from './save-split-result-to-temp.use-case'

/**
 * Kết quả nội bộ của mỗi hàm tách câu hỏi.
 * - questions: các câu đã được parse thành công (dạng SplitQuestion để tiện lưu DB)
 * - displayQuestions: dự liệu hiển thị cho response
 * - errors: các dòng không hợp lệ kèm số dòng (1-based, dòng trống vẫn tính)
 */
interface SplitResult {
    questions: SplitQuestion[]
    displayQuestions: ManualSplitQuestionItemDto[]
    errors: ParseErrorItemDto[]
}

/** Mapping QuestionType -> TempSection title & order */
const SECTION_CONFIG: Record<QuestionType, { title: string; order: number }> = {
    [QuestionType.SINGLE_CHOICE]: { title: 'Phần I: Trắc nghiệm', order: 1 },
    [QuestionType.TRUE_FALSE]: { title: 'Phần II: Đúng sai', order: 2 },
    [QuestionType.SHORT_ANSWER]: { title: 'Phần III: Trả lời ngắn', order: 3 },
    [QuestionType.ESSAY]: { title: 'Phần IV: Tự luận', order: 4 },
    [QuestionType.MULTIPLE_CHOICE]: { title: 'Phần V: Chọn nhiều đáp án', order: 5 },
}

/**
 * Use case: Tách câu hỏi thủ công từ rawContent theo từng loại câu hỏi
 *
 * Người dùng truyền vào rawContent và questionType,
 * use case gọi logic tách tương ứng với loại đó.
 * Logic tách của từng loại để trống, chờ triển khai.
 */
@Injectable()
export class ManualSplitQuestionsUseCase {
    constructor(
        @Inject('IAdminAuditLogRepository')
        private readonly auditLogRepository: IAdminAuditLogRepository,
        @Inject('IExamImportSessionRepository')
        private readonly sessionRepository: IExamImportSessionRepository,
        @Inject('ITempExamRepository')
        private readonly tempExamRepository: ITempExamRepository,
        @Inject('UNIT_OF_WORK')
        private readonly unitOfWork: IUnitOfWork,
        private readonly saveSplitResultToTempUseCase: SaveSplitResultToTempUseCase,
    ) { }

    async execute(
        sessionId: number,
        adminId: number,
        userId: number,
        dto: ManualSplitQuestionsDto,
    ): Promise<BaseResponseDto<ManualSplitQuestionsResponseDto>> {
        const startTime = Date.now()

        try {
            // ─── Validate session tồn tại & quyền truy cập ───────────────────────
            const session = await this.sessionRepository.findById(sessionId)
            if (!session) {
                await this.auditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.MANUAL_SPLIT_QUESTIONS,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: `Session ${sessionId} không tồn tại`,
                })
                throw new Error(`Session ${sessionId} không tồn tại`)
            }

            if (session.createdBy !== adminId) {
                await this.auditLogRepository.create({
                    adminId,
                    actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.MANUAL_SPLIT_QUESTIONS,
                    status: AuditStatus.FAIL,
                    resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                    resourceId: sessionId.toString(),
                    errorMessage: 'Bạn không có quyền truy cập session này',
                })
                throw new Error('Bạn không có quyền truy cập session này')
            }

            // ─── Kiểm tra TempExam đã được tạo trong session ─────────────────────
            const tempExam = await this.tempExamRepository.findBySessionId(sessionId)
            if (!tempExam) {
                throw new Error(
                    `Session ${sessionId} chưa có TempExam. Vui lòng tạo TempExam trước khi thêm câu hỏi.`,
                )
            }
            const subjectId = tempExam.subjectId ?? null

            // ─── Validate rawContent ──────────────────────────────────────────────
            const { rawContent, questionType } = dto
            if (!rawContent || rawContent.trim().length === 0) {
                throw new Error('Nội dung không được để trống')
            }

            // ─── Gọi logic tách tương ứng với loại câu hỏi ───────────────────────
            const splitResult = this.splitByType(rawContent.trim(), questionType, dto.answers)

            // ─── Gắn subjectId vào tất cả câu hỏi vừa tách ─────────────────────
            if (subjectId !== null) {
                for (const q of splitResult.questions) {
                    q.subjectId = subjectId
                }
            }

            // ─── Tìm hoặc tạo TempSection phù hợp với loại câu hỏi ──────────────
            const tempSection = await this.findOrCreateTempSection(sessionId, questionType)

            const processingTimeMs = Date.now() - startTime
            const hasParseErrors = splitResult.errors.length > 0

            // ─── Nếu không có lỗi → lưu vào DB ──────────────────────────────────
            let savedQuestions: number | undefined
            let savedStatements: number | undefined

            if (!hasParseErrors && splitResult.questions.length > 0) {
                const saveResult = await this.saveSplitResultToTempUseCase.execute(
                    sessionId,
                    splitResult.questions,
                    adminId,
                    userId,
                    null,
                    tempSection.tempSectionId,
                )
                savedQuestions = saveResult.data?.savedQuestions
                savedStatements = saveResult.data?.savedStatements
            }

            // ─── Audit log ─────────────────────────────────────────────────────────
            await this.auditLogRepository.create({
                adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.MANUAL_SPLIT_QUESTIONS,
                status: hasParseErrors ? AuditStatus.FAIL : AuditStatus.SUCCESS,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId.toString(),
                afterData: {
                    questionType,
                    subjectId,
                    tempSectionId: tempSection.tempSectionId,
                    tempSectionTitle: tempSection.title,
                    totalQuestions: splitResult.displayQuestions.length,
                    totalParseErrors: splitResult.errors.length,
                    savedQuestions,
                    savedStatements,
                    processingTimeMs,
                    contentLength: rawContent.length,
                },
            })

            const message = hasParseErrors
                ? `Tách câu hỏi có lỗi: ${splitResult.displayQuestions.length} câu đúng, ${splitResult.errors.length} dòng lỗi`
                : `Tách và lưu thành công: ${splitResult.displayQuestions.length} câu hỏi (${questionType})`

            return {
                success: !hasParseErrors,
                message,
                data: {
                    questionType,
                    tempSectionId: tempSection.tempSectionId,
                    tempSectionTitle: tempSection.title,
                    tempSectionOrder: tempSection.order,
                    questions: splitResult.displayQuestions,
                    totalQuestions: splitResult.displayQuestions.length,
                    hasParseErrors,
                    parseErrors: splitResult.errors,
                    savedQuestions,
                    savedStatements,
                    processingTimeMs,
                },
            }
        } catch (error: any) {
            await this.auditLogRepository.create({
                adminId,
                actionKey: ACTION_KEYS.EXAM_IMPORT_SESSION.MANUAL_SPLIT_QUESTIONS,
                status: AuditStatus.FAIL,
                resourceType: RESOURCE_TYPES.EXAM_IMPORT_SESSION,
                resourceId: sessionId?.toString(),
                errorMessage: error.message,
                afterData: {
                    questionType: dto.questionType,
                    contentLength: dto.rawContent?.length || 0,
                },
            })
            throw error
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  SECTION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Tìm TempSection có title trùng với loại câu hỏi trong session.
     * Nếu chưa có thì tạo mới.
     */
    private async findOrCreateTempSection(sessionId: number, questionType: QuestionType): Promise<TempSection> {
        const config = SECTION_CONFIG[questionType]

        return this.unitOfWork.executeInTransaction(async (repos) => {
            const tempSectionRepo = repos.tempSectionRepository

            const existingSections = await tempSectionRepo.findBySessionId(sessionId)
            const matched = existingSections.find((s) => s.title === config.title)

            if (matched) {
                return matched
            }

            return tempSectionRepo.create({
                sessionId,
                title: config.title,
                order: config.order,
            })
        })
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  DISPATCHER
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Điều phối sang đúng hàm tách theo questionType
     */
    private splitByType(rawContent: string, questionType: QuestionType, answers?: string): SplitResult {
        switch (questionType) {
            case QuestionType.SINGLE_CHOICE:
            case QuestionType.MULTIPLE_CHOICE:
                return this.splitSingleChoiceQuestions(rawContent, questionType, answers)

            case QuestionType.TRUE_FALSE:
                return this.splitTrueFalseQuestions(rawContent, answers)

            case QuestionType.SHORT_ANSWER:
                return this.splitShortAnswerQuestions(rawContent, answers)

            case QuestionType.ESSAY:
                return this.splitEssayQuestions(rawContent)

            default:
                return { questions: [], displayQuestions: [], errors: [] }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PER-TYPE SPLITTERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Tách câu hỏi trắc nghiệm một đáp án / nhiều đáp án.
     *
     * Định dạng mỗi câu:
     *   Câu X. <nội dung câu hỏi (có thể nhiều dòng)>
     *   A. <đáp án A>
     *   B. <đáp án B>
     *   C. <đáp án C>
     *   D. <đáp án D>
     *   Lời giải
     *   Chọn <A|B|C|D>
     *   <giải thích>
     */
    private splitSingleChoiceQuestions(rawContent: string, type: QuestionType, answersRaw?: string): SplitResult {
        const questions: SplitQuestion[] = []
        const displayQuestions: ManualSplitQuestionItemDto[] = []
        const errors: ParseErrorItemDto[] = []

        const allLines = rawContent.split('\n')

        // Parse chuỗi đáp án truyền vào (nếu có)
        // Mỗi token cách nhau bởi space là đáp án 1 câu, ví dụ: "AB AC A D"
        //   → câu 1: ["A","B"], câu 2: ["A","C"], câu 3: ["A"], câu 4: ["D"]
        const parsedAnswers: string[][] = answersRaw
            ? answersRaw.trim().split(/\s+/).map(token =>
                token.toUpperCase().split('').filter(c => /[A-F]/.test(c))
            )
            : []

        // Hỗ trợ lỗi chính tả tối đa:
        //   câu / cau / Cu / cu  +  dấu cách tuỳ ý  +  số  +  . : )
        const QUESTION_START = /^c[âa]?u\s*\d+[.:)]/i

        // A–F (hoa/thường), dấu . ) :  — tối thiểu phải có A B C D
        const STATEMENT = /^([A-Fa-f])[.:)]\s*(.*)/

        // Lời giải / loi giai / lời giải (chấp nhận thiếu dấu)
        const SOLUTION_MARKER = /^l[oờ]i\s*gi[aả]i/i

        // Strip prefix "Câu X." bất kể dạng viết
        const STRIP_PREFIX = /^c[âa]?u\s*\d+[.:)]\s*/i

        // ─── Kiểm tra ký hiệu không hợp lệ (markdown / bảng) ────────────────
        // Phát hiện: heading (#), bold (**), đường kẻ ngang (---), hàng bảng (|)
        const INVALID_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
            { pattern: /^#{1,6}(\s|$)/, label: 'heading markdown (#)' },
            { pattern: /\*\*/, label: 'in đậm markdown (**)' },
            { pattern: /^-{3,}\s*$/, label: 'đường kẻ ngang markdown (---)' },
            
        ]

        for (let i = 0; i < allLines.length; i++) {
            const trimmed = allLines[i].trim()
            if (!trimmed) continue
            for (const { pattern, label } of INVALID_PATTERNS) {
                if (pattern.test(trimmed)) {
                    errors.push({
                        lineIndex: i,
                        line: allLines[i],
                        message: `Dòng chứa ký hiệu không hợp lệ: ${label}`,
                    })
                    break // chỉ báo một lỗi mỗi dòng
                }
            }
        }

        if (errors.length > 0) {
            return { questions, displayQuestions, errors }
        }

        // ─── Tìm vị trí bắt đầu của từng câu (0-based) ───────────────────────
        const questionStarts: number[] = []
        for (let i = 0; i < allLines.length; i++) {
            if (QUESTION_START.test(allLines[i].trim())) {
                questionStarts.push(i)
            }
        }

        if (questionStarts.length === 0) {
            errors.push({
                lineIndex: 1,
                line: allLines[0] ?? '',
                message: 'Không tìm thấy câu hỏi nào. Mỗi câu phải bắt đầu bằng "Câu X." (hoặc dạng tương tự)',
            })
            return { questions, displayQuestions, errors }
        }

        for (let qi = 0; qi < questionStarts.length; qi++) {
            const blockStart = questionStarts[qi]
            const blockEnd = qi + 1 < questionStarts.length ? questionStarts[qi + 1] : allLines.length
            const blockLines = allLines.slice(blockStart, blockEnd)

            // Mở rộng các đáp án nằm cùng 1 dòng thành từng dòng riêng
            const expandedBlockLines = this.expandInlineStatements(blockLines)

            // lineIndex 1-based trong toàn bộ rawContent
            const lineAt = (localIdx: number) => blockStart + localIdx + 1

            // ─── Tìm dòng đáp án đầu tiên ─────────────────────────────────────────
            let stmtStartLocal = -1
            for (let li = 0; li < expandedBlockLines.length; li++) {
                if (STATEMENT.test(expandedBlockLines[li].trim())) {
                    stmtStartLocal = li
                    break
                }
            }

            if (stmtStartLocal === -1) {
                errors.push({
                    lineIndex: lineAt(0),
                    line: blockLines[0] ?? '',
                    message: `Câu ${qi + 1}: Không tìm thấy đáp án (A. / A) / A: hoặc chữ thường tương ứng)`,
                })
                continue
            }

            // ─── Nội dung câu hỏi ────────────────────────────────────────────────
            const contentLines = expandedBlockLines.slice(0, stmtStartLocal)
            contentLines[0] = (contentLines[0] ?? '').replace(STRIP_PREFIX, '').trim()

            const content = contentLines
                .map(l => l.trim())
                .join('\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim()

            if (!content) {
                errors.push({
                    lineIndex: lineAt(0),
                    line: blockLines[0] ?? '',
                    message: `Câu ${qi + 1}: Nội dung câu hỏi trống`,
                })
                continue
            }

            // ─── Tìm "Lời giải" ───────────────────────────────────────────────────
            let solutionMarkerLocal = -1
            for (let li = stmtStartLocal; li < expandedBlockLines.length; li++) {
                if (SOLUTION_MARKER.test(expandedBlockLines[li].trim())) {
                    solutionMarkerLocal = li
                    break
                }
            }

            // ─── Parse đáp án A-D (chuẩn hoá về chữ hoa) ────────────────────────
            const stmtEndLocal = solutionMarkerLocal !== -1 ? solutionMarkerLocal : expandedBlockLines.length
            const statementsMap = new Map<string, string>()

            for (let li = stmtStartLocal; li < stmtEndLocal; li++) {
                const match = STATEMENT.exec(expandedBlockLines[li].trim())
                if (match) {
                    const letter = match[1].toUpperCase()
                    // Chỉ ghi nhận lần đầu xuất hiện của mỗi letter
                    if (!statementsMap.has(letter)) {
                        statementsMap.set(letter, match[2].trim())
                    }
                }
            }

            // Lấy tất cả option đã parse (A-F), sắp xếp theo thứ tự alphabet
            const allParsedOptions = [...statementsMap.keys()].sort()

            // Bắt buộc phải có đủ A B C D
            const requiredOptions = ['A', 'B', 'C', 'D']
            const missingOptions = requiredOptions.filter(o => !statementsMap.has(o))
            if (missingOptions.length > 0) {
                errors.push({
                    lineIndex: lineAt(stmtStartLocal),
                    line: blockLines[0] ?? '',
                    message: `Câu ${qi + 1}: Thiếu đáp án bắt buộc ${missingOptions.join(', ')}`,
                })
                continue
            }

            // ─── Lời giải (không tách đáp án đúng, để isCorrect = false hết) ─────
            let solutionText: string | undefined

            if (solutionMarkerLocal !== -1) {
                solutionText = expandedBlockLines
                    .slice(solutionMarkerLocal + 1)
                    .map(l => l.trim())
                    .join('\n')
                    .trim() || undefined
            }

            // ─── Xác định đáp án đúng từ parsedAnswers (nếu có) ─────────────────
            // correctAnswers là mảng các chữ cái đúng của câu này, vd: ["A","B"]
            const correctAnswers: string[] = parsedAnswers.length > 0 ? (parsedAnswers[qi] ?? []) : []
            // Lưu vào DB / response dưới dạng chuỗi liền "AB", "A", …
            const correctAnswerStr = correctAnswers.length > 0 ? correctAnswers.join('') : null

            // ─── Build statements – isCorrect theo đáp án nếu có ────────────────
            const statements = allParsedOptions.map((opt, idx) => ({
                order: idx + 1,
                content: statementsMap.get(opt)!,
                isCorrect: correctAnswers.length > 0 ? correctAnswers.includes(opt) : false,
            }))

            const displayItem: ManualSplitQuestionItemDto = {
                order: qi + 1,
                content,
                type,
                statements,
                correctAnswer: correctAnswerStr ?? undefined,
                solution: solutionText,
                rawText: blockLines.join('\n').trim(),
            }

            const splitItem: SplitQuestion = {
                order: qi + 1,
                part: null,
                content,
                type,
                correctAnswer: correctAnswerStr,
                solution: solutionText ?? null,
                statements,
            }

            displayQuestions.push(displayItem)
            questions.push(splitItem)
        }

        // ─── Sau khi parse xong: kiểm tra số đáp án khớp số câu hỏi ────────────
        if (parsedAnswers.length > 0 && parsedAnswers.length !== questions.length) {
            const lastLine = allLines[allLines.length - 1] ?? ''
            errors.push({
                lineIndex: allLines.length,
                line: lastLine,
                message: `Số đáp án (${parsedAnswers.length}) không khớp với số câu hỏi tách được (${questions.length})`,
            })
            // Xoá các câu đã push vì đáp án không hợp lệ
            questions.length = 0
            displayQuestions.length = 0
        }

        return { questions, displayQuestions, errors }
    }

    /**
     * Tách câu hỏi dạng đúng/sai.
     *
     * Định dạng mỗi câu:
     *   Câu X. <nội dung câu hỏi (có thể nhiều dòng)>
     *   a. <mệnh đề a>
     *   b. <mệnh đề b>
     *   c. <mệnh đề c>
     *   d. <mệnh đề d>
     *   Lời giải
     *   <giải thích>
     *
     * answersRaw: chuỗi token cách nhau bởi space, mỗi token ứng 1 câu.
     *   Mỗi ký tự trong token: Đ/đ/D/d = Đúng (isCorrect=true), S/s = Sai (false)
     *   Ví dụ: "ĐSĐS ĐSsĐ" → câu 1: [T,F,T,F], câu 2: [T,F,F,T]
     */
    private splitTrueFalseQuestions(rawContent: string, answersRaw?: string): SplitResult {
        const questions: SplitQuestion[] = []
        const displayQuestions: ManualSplitQuestionItemDto[] = []
        const errors: ParseErrorItemDto[] = []

        const allLines = rawContent.split('\n')

        // Parse chuỗi đáp án (mỗi token → mảng boolean theo thứ tự a,b,c,d,...)
        // Đ / đ / D / d = true (Đúng), S / s = false (Sai)
        const parsedAnswers: boolean[][] = answersRaw
            ? answersRaw.trim().split(/\s+/).map(token =>
                token.split('').flatMap(c => {
                    if (/[ĐđDd]/.test(c)) return [true]
                    if (/[Ss]/.test(c)) return [false]
                    return []
                })
            )
            : []

        const QUESTION_START = /^c[âa]?u\s*\d+[.:)]/i
        // Mệnh đề a-f (hoa/thường), dấu . ) :
        const SUB_QUESTION = /^([A-Fa-f])[.:)]\s*(.*)/
        const SOLUTION_MARKER = /^l[oờ]i\s*gi[aả]i/i
        const STRIP_PREFIX = /^c[âa]?u\s*\d+[.:)]\s*/i

        // ─── Kiểm tra ký hiệu không hợp lệ ──────────────────────────────────
        const INVALID_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
            { pattern: /^#{1,6}(\s|$)/, label: 'heading markdown (#)' },
            { pattern: /\*\*/, label: 'in đậm markdown (**)' },
            { pattern: /^-{3,}\s*$/, label: 'đường kẻ ngang markdown (---)' },
            
        ]

        for (let i = 0; i < allLines.length; i++) {
            const trimmed = allLines[i].trim()
            if (!trimmed) continue
            for (const { pattern, label } of INVALID_PATTERNS) {
                if (pattern.test(trimmed)) {
                    errors.push({ lineIndex: i, line: allLines[i], message: `Dòng chứa ký hiệu không hợp lệ: ${label}` })
                    break
                }
            }
        }
        if (errors.length > 0) return { questions, displayQuestions, errors }

        // ─── Tìm vị trí bắt đầu từng câu ────────────────────────────────────
        const questionStarts: number[] = []
        for (let i = 0; i < allLines.length; i++) {
            if (QUESTION_START.test(allLines[i].trim())) questionStarts.push(i)
        }

        if (questionStarts.length === 0) {
            errors.push({ lineIndex: 1, line: allLines[0] ?? '', message: 'Không tìm thấy câu hỏi nào. Mỗi câu phải bắt đầu bằng "Câu X."' })
            return { questions, displayQuestions, errors }
        }

        for (let qi = 0; qi < questionStarts.length; qi++) {
            const blockStart = questionStarts[qi]
            const blockEnd = qi + 1 < questionStarts.length ? questionStarts[qi + 1] : allLines.length
            const blockLines = allLines.slice(blockStart, blockEnd)

            // Mở rộng các mệnh đề nằm cùng 1 dòng thành từng dòng riêng
            const expandedBlockLines = this.expandInlineStatements(blockLines)

            const lineAt = (li: number) => blockStart + li + 1

            // ─── Tìm mệnh đề đầu tiên (a.) ───────────────────────────────────
            let subStartLocal = -1
            for (let li = 0; li < expandedBlockLines.length; li++) {
                if (SUB_QUESTION.test(expandedBlockLines[li].trim())) { subStartLocal = li; break }
            }

            if (subStartLocal === -1) {
                errors.push({ lineIndex: lineAt(0) - 1, line: blockLines[0] ?? '', message: `Câu ${qi + 1}: Không tìm thấy mệnh đề (a. / a) / a: …)` })
                continue
            }

            // ─── Nội dung câu hỏi (trước mệnh đề đầu tiên) ──────────────────
            const contentLines = expandedBlockLines.slice(0, subStartLocal)
            contentLines[0] = (contentLines[0] ?? '').replace(STRIP_PREFIX, '').trim()
            const content = contentLines.map(l => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()

            if (!content) {
                errors.push({ lineIndex: lineAt(0) - 1, line: blockLines[0] ?? '', message: `Câu ${qi + 1}: Nội dung câu hỏi trống` })
                continue
            }

            // ─── Tìm "Lời giải" ──────────────────────────────────────────────
            let solutionMarkerLocal = -1
            for (let li = subStartLocal; li < expandedBlockLines.length; li++) {
                if (SOLUTION_MARKER.test(expandedBlockLines[li].trim())) { solutionMarkerLocal = li; break }
            }

            // ─── Parse mệnh đề a-d (và E, F nếu có), chuẩn hoá về chữ hoa ─
            const subEndLocal = solutionMarkerLocal !== -1 ? solutionMarkerLocal : expandedBlockLines.length
            const subMap = new Map<string, string[]>() // letter → [dòng nội dung]
            let currentLetter = ''

            for (let li = subStartLocal; li < subEndLocal; li++) {
                const trimmed = expandedBlockLines[li].trim()
                const match = SUB_QUESTION.exec(trimmed)
                if (match) {
                    currentLetter = match[1].toUpperCase()
                    if (!subMap.has(currentLetter)) subMap.set(currentLetter, [])
                    if (match[2].trim()) subMap.get(currentLetter)!.push(match[2].trim())
                } else if (currentLetter && trimmed) {
                    subMap.get(currentLetter)!.push(trimmed)
                }
            }

            // Bắt buộc a, b, c, d
            const requiredSubs = ['A', 'B', 'C', 'D']
            const missingSubs = requiredSubs.filter(k => !subMap.has(k))
            if (missingSubs.length > 0) {
                errors.push({
                    lineIndex: lineAt(subStartLocal) - 1,
                    line: blockLines[0] ?? '',
                    message: `Câu ${qi + 1}: Thiếu mệnh đề bắt buộc ${missingSubs.join(', ')}`,
                })
                continue
            }

            const allSubKeys = [...subMap.keys()].sort()

            // ─── Lời giải ────────────────────────────────────────────────────
            let solutionText: string | undefined
            if (solutionMarkerLocal !== -1) {
                solutionText = expandedBlockLines.slice(solutionMarkerLocal + 1).map(l => l.trim()).join('\n').trim() || undefined
            }

            // ─── Đáp án từ parsedAnswers ─────────────────────────────────────
            const correctFlags: boolean[] = parsedAnswers.length > 0 ? (parsedAnswers[qi] ?? []) : []

            // ─── Build statements ────────────────────────────────────────────
            const statements = allSubKeys.map((key, idx) => ({
                order: idx + 1,
                content: subMap.get(key)!.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
                isCorrect: idx < correctFlags.length ? correctFlags[idx] : false,
            }))

            const displayItem: ManualSplitQuestionItemDto = {
                order: qi + 1, content, type: QuestionType.TRUE_FALSE, statements,
                correctAnswer: undefined, solution: solutionText, rawText: blockLines.join('\n').trim(),
            }
            const splitItem: SplitQuestion = {
                order: qi + 1, part: null, content, type: QuestionType.TRUE_FALSE,
                correctAnswer: null, solution: solutionText ?? null, statements,
            }

            displayQuestions.push(displayItem)
            questions.push(splitItem)
        }

        // ─── Kiểm tra số token đáp án khớp số câu hỏi ───────────────────────
        if (parsedAnswers.length > 0 && parsedAnswers.length !== questions.length) {
            const lastLine = allLines[allLines.length - 1] ?? ''
            errors.push({
                lineIndex: allLines.length - 1,
                line: lastLine,
                message: `Số token đáp án (${parsedAnswers.length}) không khớp với số câu hỏi tách được (${questions.length})`,
            })
            questions.length = 0
            displayQuestions.length = 0
        }

        return { questions, displayQuestions, errors }
    }

    /**
     * Tách câu hỏi trả lời ngắn.
     *
     * Định dạng mỗi câu:
     *   Câu X. <nội dung câu hỏi (có thể nhiều dòng)>
     *   [Lời giải]           ← tuỳ chọn
     *   <giải thích>
     *
     * answersRaw: chuỗi đáp án cách nhau bởi space, mỗi token ứng 1 câu.
     *   Dấu , tự động đổi thành . (số thập phân Việt Nam).
     *   Ví dụ: '2 20 2 4 2 5' → câu 1=2, câu 2=20, …
     */
    private splitShortAnswerQuestions(rawContent: string, answersRaw?: string): SplitResult {
        const questions: SplitQuestion[] = []
        const displayQuestions: ManualSplitQuestionItemDto[] = []
        const errors: ParseErrorItemDto[] = []

        const allLines = rawContent.split('\n')

        // Parse đáp án từ DTO
        // Chuẩn hoá: dấu trừ Unicode (−, –) → dấu trừ chuẩn (-); dấu phẩy thập phân (,) → dấu chấm (.)
        const parsedAnswers: string[] = answersRaw
            ? answersRaw.trim().split(/\s+/).map(t =>
                t
                    .replace(/\u2212/g, '-')  // Unicode minus U+2212 (−)
                    .replace(/\u2013/g, '-')  // en dash U+2013 (–)
                    .replace(/\u2014/g, '-')  // em dash U+2014 (—)
                    .replace(/,/g, '.')        // dấu phẩy thập phân → dấu chấm
            )
            : []

        const QUESTION_START = /^c[âa]?u\s*\d+[.:)]/i
        const SOLUTION_MARKER = /^l[oờ]i\s*gi[aả]i/i
        const STRIP_PREFIX = /^c[âa]?u\s*\d+[.:)]\s*/i

        // ─── Kiểm tra ký hiệu markdown không hợp lệ ─────────────────────────
        const INVALID_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
            { pattern: /^#{1,6}(\s|$)/, label: 'heading markdown (#)' },
            { pattern: /\*\*/, label: 'in đậm markdown (**)' },
            { pattern: /^-{3,}\s*$/, label: 'đường kẻ ngang markdown (---)' },
            
        ]
        for (let i = 0; i < allLines.length; i++) {
            const trimmed = allLines[i].trim()
            if (!trimmed) continue
            for (const { pattern, label } of INVALID_PATTERNS) {
                if (pattern.test(trimmed)) {
                    errors.push({ lineIndex: i + 1, line: allLines[i], message: `Dòng chứa ký hiệu không hợp lệ: ${label}` })
                    break
                }
            }
        }
        if (errors.length > 0) return { questions, displayQuestions, errors }

        // ─── Tìm vị trí bắt đầu từng câu ────────────────────────────────────
        const questionStarts: number[] = []
        for (let i = 0; i < allLines.length; i++) {
            if (QUESTION_START.test(allLines[i].trim())) questionStarts.push(i)
        }
        if (questionStarts.length === 0) {
            errors.push({ lineIndex: 0, line: allLines[0] ?? '', message: 'Không tìm thấy câu hỏi nào. Mỗi câu phải bắt đầu bằng "Câu X."' })
            return { questions, displayQuestions, errors }
        }

        for (let qi = 0; qi < questionStarts.length; qi++) {
            const blockStart = questionStarts[qi]
            const blockEnd = qi + 1 < questionStarts.length ? questionStarts[qi + 1] : allLines.length
            const blockLines = allLines.slice(blockStart, blockEnd)
            const lineAt = (li: number) => blockStart + li + 1

            // ─── Tìm "Lời giải" (tuỳ chọn) ───────────────────────────────────
            let solutionMarkerLocal = -1
            for (let li = 0; li < blockLines.length; li++) {
                if (SOLUTION_MARKER.test(blockLines[li].trim())) { solutionMarkerLocal = li; break }
            }

            // ─── Nội dung câu hỏi (trước Lời giải nếu có, hoặc toàn block) ──
            const contentEnd = solutionMarkerLocal !== -1 ? solutionMarkerLocal : blockLines.length
            const contentLines = blockLines.slice(0, contentEnd)
            contentLines[0] = (contentLines[0] ?? '').replace(STRIP_PREFIX, '').trim()
            const content = contentLines.map(l => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim()

            if (!content) {
                errors.push({ lineIndex: lineAt(0) - 1, line: blockLines[0] ?? '', message: `Câu ${qi + 1}: Nội dung câu hỏi trống` })
                continue
            }

            // ─── Lời giải (phần sau marker, không bắt buộc) ───────────────────
            let solutionText: string | undefined
            if (solutionMarkerLocal !== -1) {
                solutionText = blockLines.slice(solutionMarkerLocal + 1).map(l => l.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim() || undefined
            }

            // ─── Đáp án từ parsedAnswers (chuẩn hoá , → . đã xử lý lúc parse)
            const correctAnswer: string | null = parsedAnswers.length > 0 ? (parsedAnswers[qi] ?? null) : null

            const displayItem: ManualSplitQuestionItemDto = {
                order: qi + 1, content, type: QuestionType.SHORT_ANSWER,
                statements: [], correctAnswer: correctAnswer ?? undefined,
                solution: solutionText, rawText: blockLines.join('\n').trim(),
            }
            const splitItem: SplitQuestion = {
                order: qi + 1, part: null, content, type: QuestionType.SHORT_ANSWER,
                correctAnswer, solution: solutionText ?? null, statements: [],
            }

            displayQuestions.push(displayItem)
            questions.push(splitItem)
        }

        // ─── Kiểm tra số đáp án khớp số câu hỏi ─────────────────────────────
        if (parsedAnswers.length > 0 && parsedAnswers.length !== questions.length) {
            const lastLine = allLines[allLines.length - 1] ?? ''
            errors.push({
                lineIndex: allLines.length - 1,
                line: lastLine,
                message: `Số đáp án (${parsedAnswers.length}) không khớp với số câu hỏi tách được (${questions.length})`,
            })
            questions.length = 0
            displayQuestions.length = 0
        }

        return { questions, displayQuestions, errors }
    }

    /**
     * Tách câu hỏi tự luận.
     * TODO: Triển khai logic tách chi tiết.
     */
    private splitEssayQuestions(_rawContent: string): SplitResult {
        return { questions: [], displayQuestions: [], errors: [] }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Xử lý trường hợp các đáp án / mệnh đề nằm trên một dòng duy nhất.
     *
     * Ví dụ (SINGLE_CHOICE / TRUE_FALSE):
     *   "A. $(SAB)$. B. $(SBC)$. C. $(SCD)$. D. $(SBD)$."
     *   → ["A. $(SAB)$.", "B. $(SBC)$.", "C. $(SCD)$.", "D. $(SBD)$."]
     *
     * Quy tắc tách: tìm khoảng trắng ngay trước ký tự marker (chữ A-F theo sau
     * là .  )  :  rồi đến khoảng trắng hoặc cuối chuỗi).
     * Chỉ tách khi dòng chứa ít nhất 2 marker, để tránh tách nhầm nội dung có
     * cụm "A." đơn lẻ (ví dụ: chú thích "xem hình A.").
     */
    private expandInlineStatements(lines: string[]): string[] {
        // Pattern đếm: (đầu chuỗi | khoảng trắng) + chữ A-F + dấu .:) + (khoảng trắng | cuối)
        const COUNT_MARKERS = /(?:^|\s)[A-Fa-f][.:)](?:\s|$)/g
        const result: string[] = []

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) { result.push(line); continue }

            const markerCount = (trimmed.match(COUNT_MARKERS) ?? []).length
            if (markerCount > 1) {
                // Tách tại vị trí khoảng trắng đứng ngay trước một option marker
                const parts = trimmed.split(/\s+(?=[A-Fa-f][.:)](?:\s|$))/)
                result.push(...parts.map(p => p.trim()).filter(p => p.length > 0))
            } else {
                result.push(line)
            }
        }
        return result
    }
}
