import { Difficulty } from '../../../shared/enums'
import { IsRequiredString, IsRequiredBoolean, IsOptionalEnumValue, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO for creating a statement
 * @description Contains information to create a new statement for a question
 */
export class CreateStatementDto {
  /**
   * Statement content
   * @required
   * @example "y' = 2x"
   */
  @IsRequiredString('Nội dung đáp án')
  content: string

  /**
   * Whether this is the correct answer
   * @required
   * @example true
   */
  @IsRequiredBoolean('Đáp án đúng/sai')
  isCorrect: boolean

  /**
   * Order of the statement
   * @optional
   * @example 1
   */
  @IsOptionalInt('Thứ tự', 0)
  order?: number

  /**
   * Difficulty level
   * @optional
   * @example "VD"
   */
  @IsOptionalEnumValue(Difficulty, 'Độ khó')
  difficulty?: Difficulty
}
