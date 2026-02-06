// src/application/dtos/question/add-question-to-section.dto.ts
import { IsRequiredIdNumber, IsOptionalInt, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO for adding a question to a section in an exam (or removing from section)
 * 
 * @description Used to add/move a question to a specific section within an exam,
 * or remove it from any section by passing sectionId as null
 */
export class AddQuestionToSectionDto {
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
     * Section ID to add the question to
     * If null or not provided, removes question from any section
     * @optional
     * @example 5
     */
    @IsOptionalIdNumber('ID phần thi')
    sectionId?: number | null

    /**
     * Order/position of the question in the section
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
