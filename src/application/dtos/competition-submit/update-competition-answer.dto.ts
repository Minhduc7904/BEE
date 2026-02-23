// src/application/dtos/competition-submit/update-competition-answer.dto.ts
import { 
    IsOptionalString, 
    IsOptionalIntArray,
    IsOptionalInt,
} from '../../../shared/decorators/validate'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { TrueFalseAnswerDto } from './submit-competition-answer.dto'

/**
 * DTO for updating an existing answer in a competition
 * 
 * @description 
 * Used when a student wants to change their answer before submitting the competition.
 * All fields are optional - you only need to provide the fields you want to update.
 * Depending on the question type:
 * - For SHORT_ANSWER, ESSAY: update `answer` field
 * - For SINGLE_CHOICE, MULTIPLE_CHOICE: update `selectedStatementIds` field
 * - For TRUE_FALSE: update `trueFalseAnswers` field
 */
export class UpdateCompetitionAnswerDto {
    /**
     * Updated text answer for SHORT_ANSWER or ESSAY questions
     * @optional
     * @maxLength 10000
     * @example "Paris là thủ đô của nước Pháp (cập nhật)"
     */
    @IsOptionalString('Câu trả lời dạng văn bản', 10000)
    answer?: string

    /**
     * Updated array of selected statement IDs for SINGLE_CHOICE, MULTIPLE_CHOICE questions
     * @optional
     * @example [2, 4]
     */
    @IsOptionalIntArray('Danh sách ID các phương án đã chọn')
    selectedStatementIds?: number[]

    /**
     * Updated array of TRUE_FALSE answers - each statement with true/false selection
     * Only for TRUE_FALSE questions
     * @optional
     * @example [{ statementId: 1, isTrue: false }, { statementId: 2, isTrue: true }]
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TrueFalseAnswerDto)
    trueFalseAnswers?: TrueFalseAnswerDto[]

    /**
     * Updated time spent on this question in seconds (optional, for analytics)
     * @optional
     * @min 0
     * @max 86400 (24 hours)
     * @example 60
     */
    @IsOptionalInt('Thời gian làm câu hỏi (giây)', 0, 86400)
    timeSpentSeconds?: number
}
