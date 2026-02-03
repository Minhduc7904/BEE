// src/application/dtos/homeworkSubmit/update-homework-submit.dto.ts
import { IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO for updating homework submission
 * 
 * @description Used when a student updates their homework submission
 */
export class UpdateHomeworkSubmitDto {
    /**
     * Submission content (answer)
     * @optional
     * @example 'Updated answer to question 1: ...'
     */
    @IsOptionalString('Nội dung bài làm')
    content?: string
}
