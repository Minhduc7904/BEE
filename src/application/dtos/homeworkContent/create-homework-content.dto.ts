// src/application/dtos/homeworkContent/create-homework-content.dto.ts
import { IsRequiredIdNumber, IsRequiredString, IsOptionalDate, IsOptionalIdNumber, IsOptionalBoolean } from 'src/shared/decorators/validate'

/**
 * DTO for creating homework content
 * 
 * @description Used to create a new homework content item for a learning item
 */
export class CreateHomeworkContentDto {
    /**
     * Learning item ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID mục học')
    learningItemId: number

    /**
     * Homework content description
     * @required
     * @example 'Complete exercises 1-10 on page 25'
     */
    @IsRequiredString('Nội dung bài tập')
    content: string

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
     * @default false
     * @example true
     */
    @IsOptionalBoolean('Cho phép nộp muộn')
    allowLateSubmit?: boolean
}
