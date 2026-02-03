// src/application/dtos/question/update-question.dto.ts
import { QuestionType, Difficulty, Visibility } from '../../../shared/enums'
import {
  IsOptionalString,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIdNumber,
  IsOptionalNumber,
  IsOptionalIntArray,
} from 'src/shared/decorators/validate'
import { Type } from 'class-transformer'
import { ValidateNested, IsOptional, IsArray } from 'class-validator'
import { UpdateStatementDto } from '../statement/update-statement.dto'

/**
 * DTO for updating a question
 *
 * @description Contains fields that can be updated for an existing question
 */
export class UpdateQuestionDto {
  /**
   * Question content
   * @optional
   * @example "Tính đạo hàm của hàm số y = x^3"
   */
  @IsOptionalString('Nội dung câu hỏi')
  content?: string

  /**
   * Question type
   * @optional
   * @example "MULTIPLE_CHOICE"
   */
  @IsOptionalEnumValue(QuestionType, 'Loại câu hỏi')
  type?: QuestionType

  /**
   * Correct answer
   * @optional
   * @example "3x^2"
   */
  @IsOptionalString('Đáp án đúng')
  correctAnswer?: string

  /**
   * Solution explanation
   * @optional
   * @example "Áp dụng quy tắc: (x^n)' = nx^(n-1)"
   */
  @IsOptionalString('Lời giải')
  solution?: string

  /**
   * Solution YouTube URL
   * @optional
   * @example "https://youtube.com/watch?v=yyy"
   */
  @IsOptionalString('Link Youtube lời giải')
  solutionYoutubeUrl?: string

  /**
   * Difficulty level
   * @optional
   * @example "VDC"
   */
  @IsOptionalEnumValue(Difficulty, 'Độ khó')
  difficulty?: Difficulty

  /**
   * Grade level (1-12)
   * @optional
   * @example 11
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * Subject ID
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('Môn học')
  subjectId?: number

  /**
   * Original points
   * @optional
   * @example 2.0
   */
  @IsOptionalNumber('Điểm gốc', 0)
  pointsOrigin?: number

  /**
   * Visibility status
   * @optional
   * @example "PUBLISHED"
   */
  @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
  visibility?: Visibility

  /**
   * Chapter IDs
   * @optional
   * @example [4, 5, 6]
   */
  @IsOptionalIntArray('Danh sách chương')
  chapterIds?: number[]

  /**
   * Statements (answers)
   * @optional
   * @description If provided, will sync statements: create new, update existing, delete removed
   * @example [{ statementId: 1, content: "A. 2x", isCorrect: true }]
   */
  @IsOptional()
  @IsArray({ message: 'Statements phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => UpdateStatementDto)
  statements?: UpdateStatementDto[]
}
