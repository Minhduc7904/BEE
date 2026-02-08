// src/application/dtos/question/search-questions.dto.ts
import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalIdNumber, IsOptionalEnumValue, IsOptionalInt, IsOptionalString, IsOptionalIntArray } from 'src/shared/decorators/validate'
import { QuestionType, Difficulty } from 'src/shared/enums'

/**
 * DTO for searching questions with advanced filters
 * 
 * @description Extended search with content filtering, chapter, grade, difficulty, and type
 */
export class SearchQuestionsDto extends ListQueryDto {
  /**
   * Search by content (question text, solution, statements)
   * @optional
   * @example "đạo hàm"
   */
  @IsOptionalString('Nội dung tìm kiếm')
  content?: string

  /**
   * Filter by difficulty level
   * @optional
   * @example "VD"
   */
  @IsOptionalEnumValue(Difficulty, 'Độ khó')
  difficulty?: Difficulty

  /**
   * Filter by question type
   * @optional
   * @example "SINGLE_CHOICE"
   */
  @IsOptionalEnumValue(QuestionType, 'Loại câu hỏi')
  type?: QuestionType

  /**
   * Filter by chapter IDs (multiple chapters)
   * @optional
   * @example [5, 10, 15]
   */
  @IsOptionalIntArray('Danh sách ID chương')
  chapterIds?: number[]

  /**
   * Filter by grade (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * Filter by subject ID
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

  /**
   * Exclude questions by IDs (e.g., questions already in exam)
   * @optional
   * @example [1, 2, 3]
   */
  @IsOptionalIntArray('Danh sách ID câu hỏi cần loại bỏ')
  excludeQuestionIds?: number[]
}
