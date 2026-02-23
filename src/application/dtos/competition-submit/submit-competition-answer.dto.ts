// src/application/dtos/competition-submit/submit-competition-answer.dto.ts
import { 
    IsRequiredIdNumber, 
    IsOptionalString, 
    IsOptionalIntArray,
    IsOptionalInt,
    IsRequiredBoolean,
} from '../../../shared/decorators/validate'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'
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
     * Student's selection: true if they think the statement is true, false otherwise
     * @required
     * @example true
     */
    @IsRequiredBoolean('Lựa chọn đúng/sai')
    isTrue: boolean
}

/**
 * DTO for submitting or updating an answer in a competition
 * 
 * @description 
 * Used when a student answers a question during a competition attempt.
 * Depending on the question type:
 * - For SHORT_ANSWER, ESSAY: use `answer` field
 * - For SINGLE_CHOICE, MULTIPLE_CHOICE: use `selectedStatementIds` field
 * - For TRUE_FALSE: use `trueFalseAnswers` field
 * - You can provide both if needed, but typically only one is used per question type
 */
export class SubmitCompetitionAnswerDto {
    /**
     * Question ID being answered
     * @required
     * @example 123
     */
    @IsRequiredIdNumber('ID câu hỏi')
    questionId: number

    /**
     * Text answer for SHORT_ANSWER or ESSAY questions
     * @optional
     * @maxLength 10000
     * @example "Paris là thủ đô của nước Pháp"
     */
    @IsOptionalString('Câu trả lời dạng văn bản', 10000)
    answer?: string

    /**
     * Array of selected statement IDs for SINGLE_CHOICE, MULTIPLE_CHOICE questions
     * @optional
     * @example [1, 3, 5]
     */
    @IsOptionalIntArray('Danh sách ID các phương án đã chọn')
    selectedStatementIds?: number[]

    /**
     * Array of TRUE_FALSE answers - each statement with true/false selection
     * Only for TRUE_FALSE questions
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
