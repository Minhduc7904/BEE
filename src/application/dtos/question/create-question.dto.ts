// src/application/dtos/question/create-question.dto.ts
import { QuestionType, Difficulty, Visibility } from '../../../shared/enums'
import {
  IsRequiredString,
  IsRequiredEnumValue,
  IsOptionalString,
  IsOptionalEnumValue,
  IsOptionalInt,
  IsOptionalIdNumber,
  IsOptionalNumber,
  IsOptionalIntArray,
} from 'src/shared/decorators/validate'
import { Type } from 'class-transformer'
import { ValidateNested, IsOptional, IsArray } from 'class-validator'
import { CreateStatementDto } from '../statement/create-statement.dto'

/**
 * DTO for creating a question
 * 
 * @description Contains information to create a new question in the question bank
 */
export class CreateQuestionDto {
  /**
   * Question content
   * @required
   * @example "Tính đạo hàm của hàm số y = x^2"
   */
  @IsRequiredString('Nội dung câu hỏi')
  content: string

  /**
   * Question type
   * @required
   * @example "SINGLE_CHOICE"
   */
  @IsRequiredEnumValue(QuestionType, 'Loại câu hỏi')
  type: QuestionType

  /**
   * Correct answer
   * @optional
   * @example "A"
   */
  @IsOptionalString('Đáp án đúng')
  correctAnswer?: string

  /**
   * Solution explanation
   * @optional
   * @example "Áp dụng quy tắc đạo hàm cơ bản: (x^n)' = nx^(n-1)"
   */
  @IsOptionalString('Lời giải')
  solution?: string

  /**
   * Solution YouTube URL
   * @optional
   * @example "https://youtube.com/watch?v=xxx"
   */
  @IsOptionalString('Link Youtube lời giải')
  solutionYoutubeUrl?: string

  /**
   * Difficulty level
   * @optional
   * @example "VD"
   */
  @IsOptionalEnumValue(Difficulty, 'Độ khó')
  difficulty?: Difficulty

  /**
   * Grade level (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * Subject ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('Môn học')
  subjectId?: number

  /**
   * Original points
   * @optional
   * @example 1.0
   */
  @IsOptionalNumber('Điểm gốc', 0)
  pointsOrigin?: number

  /**
   * Visibility status
   * @optional
   * @default "DRAFT"
   * @example "PUBLISHED"
   */
  @IsOptionalEnumValue(Visibility, 'Trạng thái hiển thị')
  visibility?: Visibility

  /**
   * Chapter IDs
   * @optional
   * @example [1, 2, 3]
   */
  @IsOptionalIntArray('Danh sách chương')
  chapterIds?: number[]

  /**
   * Statements (answers)
   * @optional
   * @example [{ content: "A. 2x", isCorrect: true, order: 1 }]
   */
  @IsOptional()
  @IsArray({ message: 'Statements phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateStatementDto)
  statements?: CreateStatementDto[]
}
