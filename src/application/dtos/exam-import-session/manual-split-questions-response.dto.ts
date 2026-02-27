// src/application/dtos/exam-import-session/manual-split-questions-response.dto.ts
import { QuestionType } from '../../../shared/enums/question-type.enum'

/**
 * Thông tin một dòng bị lỗi khi tách câu hỏi.
 * Dòng trống vẫn được đánh số; lineIndex là 1-based.
 */
export class ParseErrorItemDto {
    /** Số thứ tự dòng trong rawContent (1-based, dòng trống vẫn tính) */
    lineIndex: number
    /** Nội dung dòng gốc */
    line: string
    /** Mô tả lỗi */
    message: string
}
export class ManualSplitStatementItemDto {
    /** Thứ tự (1-based) */
    order: number
    /** Nội dung mệnh đề */
    content: string
    /** Đúng / Sai (nếu xác định được) */
    isCorrect?: boolean
}

/**
 * Một câu hỏi đã được tách từ rawContent
 */
export class ManualSplitQuestionItemDto {
    /** Thứ tự câu (1-based) */
    order: number
    /** Nội dung câu hỏi */
    content: string
    /** Loại câu hỏi */
    type: QuestionType
    /** Danh sách đáp án / mệnh đề (nếu có) */
    statements?: ManualSplitStatementItemDto[]
    /** Đáp án đúng (nếu xác định được) */
    correctAnswer?: string
    /** Lời giải (nếu có) */
    solution?: string
    /** Đoạn văn bản thô gốc của câu này trước khi tách */
    rawText?: string
}

/**
 * Response DTO cho API tách câu hỏi thủ công.
 * Nếu có dòng lỗi: success = false, parseErrors chứa danh sách lỗi theo từng dòng.
 */
export class ManualSplitQuestionsResponseDto {
    /** Loại câu hỏi đã tách */
    questionType: QuestionType
    /** ID của TempSection đã tìm hoặc tạo */
    tempSectionId: number
    /** Tiêu đề TempSection */
    tempSectionTitle: string
    /** Order của TempSection */
    tempSectionOrder: number
    /** Danh sách câu hỏi đã tách thành công */
    questions: ManualSplitQuestionItemDto[]
    /** Tổng số câu hỏi đã tách thành công */
    totalQuestions: number
    /** Có dòng lỗi hay không */
    hasParseErrors: boolean
    /** Danh sách các dòng bị lỗi (rỗng nếu không có lỗi) */
    parseErrors: ParseErrorItemDto[]
    /** Số câu hỏi đã lưu vào DB (chỉ có khi không có lỗi) */
    savedQuestions?: number
    /** Số đáp án đã lưu vào DB (chỉ có khi không có lỗi) */
    savedStatements?: number
    /** Thời gian xử lý (ms) */
    processingTimeMs: number
}