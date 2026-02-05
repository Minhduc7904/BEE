// src/application/dtos/exam/update-exam.dto.ts
import { IsOptionalString, IsOptionalInt, IsOptionalEnumValue, IsOptionalIdNumber, IsOptionalIntArray } from '../../../shared/decorators/validate'
import { ExamVisibility } from '../../../shared/enums'

export class UpdateExamDto {
  /**
   * Tên đề thi
   * @example "Đề thi Toán học kỳ 1 năm 2024"
   */
  @IsOptionalString('Tên đề thi', 500, 1)
  title?: string

  /**
   * Khối lớp (1-12)
   * @example 10
   */
  @IsOptionalInt('Khối lớp', 1, 12)
  grade?: number

  /**
   * Trạng thái hiển thị
   * @example "PUBLISHED"
   */
  @IsOptionalEnumValue(ExamVisibility, 'Trạng thái hiển thị')
  visibility?: ExamVisibility

  /**
   * Mô tả đề thi
   * @example "Đề thi giữa kỳ môn Toán lớp 10"
   */
  @IsOptionalString('Mô tả', 2000, 0)
  description?: string

  /**
   * ID môn học
   * @example 5
   */
  @IsOptionalIdNumber('ID môn học')
  subjectId?: number

  /**
   * URL video hướng dẫn giải
   * @example "https://youtube.com/watch?v=abc123"
   */
  @IsOptionalString('URL video hướng dẫn', 500, 0)
  solutionYoutubeUrl?: string

  /**
   * Danh sách ID câu hỏi để cập nhật
   * @example [1, 2, 3, 4, 5]
   */
  @IsOptionalIntArray('Danh sách ID câu hỏi')
  questionIds?: number[]
}
