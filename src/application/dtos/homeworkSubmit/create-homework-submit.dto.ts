// src/application/dtos/homeworkSubmit/create-homework-submit.dto.ts
import { IsRequiredIdNumber, IsRequiredString } from 'src/shared/decorators/validate'

/**
 * DTO for creating homework submission
 * 
 * @description Used when a student submits homework
 */
export class CreateHomeworkSubmitDto {
    /**
     * Homework content ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID nội dung bài tập')
    homeworkContentId: number

    /**
     * Student ID
     * @required
     * @example 10
     */
    @IsRequiredIdNumber('ID học sinh')
    studentId: number

    /**
     * Submission content (answer)
     * @required
     * @example 'Answer to question 1: ...'
     */
    @IsRequiredString('Nội dung bài làm')
    content: string
}
