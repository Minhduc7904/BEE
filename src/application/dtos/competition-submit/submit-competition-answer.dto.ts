// src/application/dtos/competition-submit/submit-competition-answer.dto.ts
import {
    IsOptionalIntArray,
    IsOptionalInt,
    IsRequiredIdNumber,
} from '../../../shared/decorators/validate'
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for TRUE_FALSE question answer
 * Each statement must be marked as true or false
 */
export class TrueFalseAnswerDto {
    /**
     * Statement ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID phát biểu')
    statementId: number

    /**
     * Student's selection:
     * - true  : mệnh đề là đúng
     * - false : mệnh đề là sai
     * - null  : chưa trả lời (giữ nguyên trạng thái null, không được tính điểm)
     * @optional — nếu không gửi hoặc gửi null, mệnh đề được coi là chưa trả lời
     * @example true
     */
    @IsOptional()
    @IsBoolean({ message: 'Lựa chọn đúng/sai phải là true hoặc false' })
    isTrue?: boolean | null
}

/**
 * DTO for submitting or updating an answer in a competition
 * 
 * @description 
 * Used when a student answers a question during a competition attempt.
 * The answer is identified by `answerId` in the URL — no need to pass questionId in body.
 * Depending on the question type:
 * - For SHORT_ANSWER, ESSAY: use `answer` field
 * - For SINGLE_CHOICE, MULTIPLE_CHOICE: use `selectedStatementIds` field
 * - For TRUE_FALSE: use `trueFalseAnswers` — must include ALL statements with their true/false selection
 */
export class SubmitCompetitionAnswerDto {
    /**
     * Text answer for SHORT_ANSWER or ESSAY questions.
     * Empty string "" is allowed and means the student cleared their answer.
     * @optional
     * @maxLength 10000
     * @example "Paris là thủ đô của nước Pháp"
     */
    @IsOptional()
    @IsString({ message: 'Câu trả lời dạng văn bản phải là chuỗi ký tự' })
    @MaxLength(10000, { message: 'Câu trả lời dạng văn bản không được vượt quá 10000 ký tự' })
    answer?: string

    /**
     * Array of selected statement IDs for SINGLE_CHOICE, MULTIPLE_CHOICE questions
     * @optional
     * @example [1, 3, 5]
     */
    @IsOptionalIntArray('Danh sách ID các phương án đã chọn')
    selectedStatementIds?: number[]

    /**
     * Array of TRUE_FALSE answers — must include ALL statements of the question,
     * each with the student's true/false selection.
     * Statements not included are treated as "not answered" (false).
     * Only for TRUE_FALSE questions.
     * @optional
     * @example [{ statementId: 1, isTrue: true }, { statementId: 2, isTrue: false }]
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrueFalseAnswerDto)
    trueFalseAnswers?: TrueFalseAnswerDto[]

    /**
     * Time spent on this question in seconds (optional, for analytics)
     * @optional
     * @min 0
     * @max 86400 (24 hours)
     * @example 45
     */
    @IsOptionalInt('Thời gian làm câu hỏi (giây)', 0, 86400)
    timeSpentSeconds?: number
}
