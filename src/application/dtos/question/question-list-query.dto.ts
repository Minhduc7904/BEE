// src/application/dtos/question/question-list-query.dto.ts
import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalInt } from 'src/shared/decorators/validate'
import { QuestionType, Difficulty, Visibility } from 'src/shared/enums'

/**
 * DTO for querying question list with filters
 * 
 * @description Extends ListQueryDto with question-specific filters
 */
export class QuestionListQueryDto extends ListQueryDto {
  /**
   * Filter by subject ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

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

  /**
   * Filter by grade (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * Filter by visibility
   * @optional
   * @example "PUBLISHED"
   */
  @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
  visibility?: Visibility

  /**
   * Filter by creator
   * @optional
   * @example 15
   */
  @IsOptionalIdNumber('Người tạo')
  createdBy?: number

  /**
   * Filter by chapter ID
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('ID chương')
  chapterId?: number
}
