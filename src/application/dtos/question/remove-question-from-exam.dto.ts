// src/application/dtos/question/remove-question-from-exam.dto.ts
import { IsRequiredIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for removing a question from an exam
 * 
 * @description Used to remove the relationship between a question and an exam
 */
export class RemoveQuestionFromExamDto {
    /**
     * Exam ID
     * @required
     * @example 10
     */
    @IsRequiredIdNumber('ID đề thi')
    examId: number

    /**
     * Question ID
     * @required
     * @example 123
     */
    @IsRequiredIdNumber('ID câu hỏi')
    questionId: number
}
