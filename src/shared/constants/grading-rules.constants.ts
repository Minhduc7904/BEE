// src/shared/constants/grading-rules.constants.ts
import { QuestionType } from '../enums'

/**
 * Điểm mặc định cho từng loại câu hỏi khi không có pointsOrigin.
 * - Trắc nghiệm 1 đáp án (SINGLE_CHOICE): 0.25 điểm
 * - Trắc nghiệm nhiều đáp án (MULTIPLE_CHOICE): 0.25 điểm
 * - Đúng/Sai (TRUE_FALSE): 1 điểm
 * - Trả lời ngắn (SHORT_ANSWER): 0.5 điểm
 * - Tự luận (ESSAY): null — không chấm tự động
 */
export const DEFAULT_QUESTION_POINTS: Partial<Record<QuestionType, number>> = {
    [QuestionType.SINGLE_CHOICE]: 0.25,
    [QuestionType.MULTIPLE_CHOICE]: 0.25,
    [QuestionType.TRUE_FALSE]: 1,
    [QuestionType.SHORT_ANSWER]: 0.5,
}

/**
 * Số mệnh đề tiêu chuẩn để áp dụng bảng điểm đặc biệt cho câu Đúng/Sai.
 */
export const TRUE_FALSE_SPECIAL_STATEMENT_COUNT = 4

/**
 * Bảng điểm đặc biệt cho câu Đúng/Sai 4 mệnh đề khi maxPoints = 1 (hoặc không có pointsOrigin).
 * Key: số mệnh đề trả lời đúng  —  Value: điểm tương ứng
 *
 * Quy tắc:
 *   - Đúng 1 mệnh đề → 0.10 điểm
 *   - Đúng 2 mệnh đề → 0.25 điểm
 *   - Đúng 3 mệnh đề → 0.50 điểm
 *   - Đúng 4 mệnh đề → 1.00 điểm
 */
export const TRUE_FALSE_4_STATEMENTS_SCORE_TABLE: Record<number, number> = {
    0: 0,
    1: 0.1,
    2: 0.25,
    3: 0.5,
    4: 1.0,
}

/**
 * Tính điểm câu Đúng/Sai theo các quy tắc:
 *
 * 1. Nếu maxPoints khác 1:
 *    → Chấm theo tỉ lệ: (maxPoints / totalStatements) * correctCount
 *
 * 2. Nếu maxPoints = 1 (hoặc không có pointsOrigin, dùng mặc định 1) VÀ có 4 mệnh đề:
 *    → Dùng bảng đặc biệt TRUE_FALSE_4_STATEMENTS_SCORE_TABLE
 *
 * 3. Các trường hợp còn lại (maxPoints = 1, số mệnh đề khác 4):
 *    → Chấm tỉ lệ: (1 / totalStatements) * correctCount
 */
export function calcTrueFalsePoints(
    correctCount: number,
    totalStatements: number,
    maxPoints: number,
): number {
    if (maxPoints !== 1) {
        // Tỉ lệ theo pointsOrigin
        return totalStatements > 0 ? (maxPoints / totalStatements) * correctCount : 0
    }

    if (totalStatements === TRUE_FALSE_SPECIAL_STATEMENT_COUNT) {
        // Bảng điểm đặc biệt 4 mệnh đề
        return TRUE_FALSE_4_STATEMENTS_SCORE_TABLE[correctCount] ?? 0
    }

    // Tỉ lệ với tổng điểm = 1
    return totalStatements > 0 ? (1 / totalStatements) * correctCount : 0
}

/**
 * Chuẩn hóa chuỗi số để so sánh (SHORT_ANSWER chỉ chấp nhận đáp án là số).
 * Chấp nhận cả dấu ',' và '.' làm dấu thập phân, xử lý số âm.
 *
 * @returns Giá trị số nếu hợp lệ, null nếu không phải số
 */
export function parseNumericAnswer(raw: string): number | null {
    const normalized = raw.trim().replace(',', '.')
    // Chấp nhận: số nguyên, số thập phân, số âm (ví dụ: -3, 3.14, -3,14)
    if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null
    return parseFloat(normalized)
}
