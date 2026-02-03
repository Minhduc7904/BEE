import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Difficulty } from '../../../shared/enums'
import { IsOptionalString, IsOptionalBoolean, IsOptionalEnumValue } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật đáp án tạm
 * @description Chứa các trường có thể cập nhật của đáp án
 */
export class UpdateTempStatementDto {
    /**
     * Nội dung đáp án
     * @optional
     * @example "y' = 2x"
     */
    @IsOptionalString('Nội dung đáp án')
    content?: string

    /**
     * Đáp án đúng/sai
     * @optional
     * @example true
     */
    @IsOptionalBoolean('Đáp án đúng/sai')
    isCorrect?: boolean

    /**
     * Độ khó
     * @optional
     * @example "EASY"
     */
    @IsOptionalEnumValue(Difficulty, 'Độ khó')
    difficulty?: Difficulty

    /**
     * Dữ liệu metadata
     * @optional
     */
    @IsOptionalString('Metadata')
    metadata?: any
}
