// src/application/dtos/question/reorder-questions.dto.ts
import { IsRequiredIdNumber, IsRequiredInt } from 'src/shared/decorators/validate'
import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for reorder item
 * 
 * @description Represents a question with its new order position
 */
export class ReorderQuestionItemDto {
    /**
     * Question ID
     * @required
     * @example 123
     */
    @IsRequiredIdNumber('ID câu hỏi')
    questionId: number

    /**
     * New order position
     * @required
     * @example 1
     */
    @IsRequiredInt('Thứ tự')
    order: number
}

/**
 * DTO for reordering questions in an exam
 * 
 * @description Used to change the order of multiple questions in an exam at once
 */
export class ReorderQuestionsDto {
    /**
     * Exam ID that contains the questions
     * @required
     * @example 10
     */
    @IsRequiredIdNumber('ID đề thi')
    examId: number

    /**
     * Array of questions with new order positions
     * @required
     * @example [{ questionId: 1, order: 2 }, { questionId: 2, order: 1 }]
     */
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReorderQuestionItemDto)
    items: ReorderQuestionItemDto[]
}
