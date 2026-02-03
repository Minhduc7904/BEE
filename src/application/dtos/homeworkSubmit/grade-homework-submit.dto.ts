// src/application/dtos/homeworkSubmit/grade-homework-submit.dto.ts
import { IsRequiredInt, IsRequiredIdNumber, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO for grading homework submission
 * 
 * @description Used when a teacher grades a student's homework submission
 */
export class GradeHomeworkSubmitDto {
    /**
     * Points awarded (0-100)
     * @required
     * @example 85
     */
    @IsRequiredInt('Điểm số', 0, 100)
    points: number

    /**
     * Grader ID (teacher ID)
     * @required
     * @example 3
     */
    @IsRequiredIdNumber('ID người chấm')
    graderId: number

    /**
     * Feedback from teacher
     * @optional
     * @example 'Good work, but needs improvement in section 2'
     */
    @IsOptionalString('Nhận xét')
    feedback?: string
}
