// src/application/dtos/question/question-by-exam-query.dto.ts
import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { QuestionType, Difficulty } from 'src/shared/enums'

/**
 * DTO for querying questions by exam ID with filters
 * 
 * @description Query parameters for fetching questions belonging to a specific exam
 */
export class QuestionByExamQueryDto extends ListQueryDto {
  /**
   * Filter by question type
   * @optional
   * @example "SINGLE_CHOICE"
   */
  @IsOptionalEnumValue(QuestionType, 'Loại câu hỏi')
  type?: QuestionType

  /**
   * Filter by difficulty
   * @optional
   * @example "VD"
   */
  @IsOptionalEnumValue(Difficulty, 'Độ khó')
  difficulty?: Difficulty
}
