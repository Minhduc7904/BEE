import { Difficulty } from '../../../shared/enums'
import { 
  IsOptionalString, 
  IsOptionalBoolean, 
  IsOptionalEnumValue, 
  IsOptionalInt, 
  IsOptionalIdNumber 
} from 'src/shared/decorators/validate'

/**
 * DTO for updating a statement
 * @description Contains information to update an existing statement
 */
export class UpdateStatementDto {
  /**
   * Statement ID (optional, if not provided, will create new statement)
   * @optional
   * @example 123
   */
  @IsOptionalIdNumber('ID đáp án')
  statementId?: number

  /**
   * Statement content
   * @optional
   * @example "y' = 2x"
   */
  @IsOptionalString('Nội dung đáp án')
  content?: string

  /**
   * Whether this is the correct answer
   * @optional
   * @example true
   */
  @IsOptionalBoolean('Đáp án đúng/sai')
  isCorrect?: boolean

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
