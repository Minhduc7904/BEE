import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { QuestionType, Difficulty } from '../../../shared/enums'
import { IsRequiredString, IsRequiredEnumValue, IsOptionalString, IsOptionalEnumValue, IsOptionalInt, IsOptionalIdNumber, IsOptionalNumber, IsOptionalIntArray } from 'src/shared/decorators/validate'

/**
 * DTO tạo câu hỏi tạm
 * @description Chứa thông tin để tạo câu hỏi tạm thời trong đề thi
 */
export class CreateTempQuestionDto {
  /**
   * Nội dung câu hỏi
   * @required
   * @example "Tính đạo hàm của hàm số y = x^2"
   */
  @IsRequiredString('Nội dung câu hỏi')
  content: string

  /**
   * Loại câu hỏi
   * @required
   * @example "MULTIPLE_CHOICE"
   */
  @IsRequiredEnumValue(QuestionType, 'Loại câu hỏi')
  type: QuestionType

  /**
   * Đáp án đúng
   * @optional
   * @example "A"
   */
  @IsOptionalString('Đáp án đúng')
  correctAnswer?: string

  /**
   * Lời giải chi tiết
   * @optional
   * @example "Sử dụng quy tắc đạo hàm cơ bản"
   */
  @IsOptionalString('Lời giải')
  solution?: string

  /**
   * Độ khó
   * @optional
   * @example "MEDIUM"
   */
  @IsOptionalEnumValue(Difficulty, 'Độ khó')
  difficulty?: Difficulty

  /**
   * Link Youtube lời giải
   * @optional
   * @example "https://youtube.com/watch?v=xxx"
   */
  @IsOptionalString('Link Youtube lời giải')
  solutionYoutubeUrl?: string

  /**
   * Khối lớp (1-12)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * ID môn học
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('Môn học')
  subjectId?: number

  /**
   * Điểm gốc
   * @optional
   * @example 1.0
   */
  @IsOptionalNumber('Điểm gốc', 0)
  pointsOrigin?: number

  /**
   * ID section
   * @optional
   * @example 3
   */
  @IsOptionalIdNumber('Section')
  tempSectionId?: number

  /**
   * Danh sách ID chương
   * @optional
   * @example [1, 2, 3]
   */
  @IsOptionalIntArray('Danh sách chương')
  chapterIds?: number[]

  /**
   * Dữ liệu metadata
   * @optional
   */
  @IsOptionalString('Metadata')
  metadata?: any
}
