import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { Difficulty } from '../../../shared/enums'
import { IsRequiredString, IsRequiredBoolean, IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO tạo đáp án tạm
 * @description Chứa thông tin để tạo đáp án cho câu hỏi
 */
export class CreateTempStatementDto {
  /**
   * Nội dung đáp án
   * @required
   * @example "y' = 2x"
   */
  @IsRequiredString('Nội dung đáp án')
  content: string

  /**
   * Đáp án đúng/sai
   * @required
   * @example true
   */
  @IsRequiredBoolean('Đáp án đúng/sai')
  isCorrect: boolean

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
