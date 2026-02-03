// src/application/dtos/homeworkContent/update-homework-content.dto.ts
import { IsOptionalString, IsOptionalDate, IsOptionalIdNumber, IsOptionalBoolean } from 'src/shared/decorators/validate'

/**
 * DTO for updating homework content
 * 
 * @description Used to update an existing homework content item
 */
export class UpdateHomeworkContentDto {
    /**
     * Homework content description
     * @optional
     * @example 'Updated: Complete exercises 1-15 on page 25'
     */
    @IsOptionalString('Nội dung bài tập')
    content?: string

    /**
     * Homework due date
     * @optional
     * @example '2024-12-31T23:59:59Z'
     */
    @IsOptionalDate('Ngày hết hạn')
    dueDate?: Date

    /**
     * Competition ID (if homework is part of a competition)
     * @optional
     * @example 5
     */
    @IsOptionalIdNumber('ID cuộc thi')
    competitionId?: number

    /**
     * Allow late submission
     * @optional
     * @example false
     */
    @IsOptionalBoolean('Cho phép nộp muộn')
    allowLateSubmit?: boolean
}
