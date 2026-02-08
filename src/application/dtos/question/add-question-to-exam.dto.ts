// src/application/dtos/question/add-question-to-exam.dto.ts
import { IsRequiredIdNumber, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO for adding a question to an exam
 * 
 * @description Used to add a question directly to an exam without assigning to a specific section
 */
export class AddQuestionToExamDto {
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

    /**
     * Order/position of the question in the exam
     * @optional
     * @example 1
     */
    @IsOptionalInt('Thứ tự')
    order?: number

    /**
     * Points for this question in the exam
     * @optional
     * @example 10
     */
    @IsOptionalInt('Điểm')
    points?: number
}
