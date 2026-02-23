// src/application/dtos/exam/create-exam.dto.ts
import { IsRequiredString, IsRequiredInt, IsRequiredEnumValue, IsOptionalString, IsOptionalIdNumber, IsOptionalIntArray, IsOptionalEnumValue } from '../../../shared/decorators/validate'
import { ExamVisibility, TypeOfExam } from '../../../shared/enums'

export class CreateExamDto {
  /**
   * Tên đề thi
   * @example "Đề thi Toán học kỳ 1 năm 2024"
   */
  @IsRequiredString('Tên đề thi', 500, 1)
  title: string

  /**
   * Khối lớp (1-12)
   * @example 10
   */
  @IsRequiredInt('Khối lớp', 1, 12)
  grade: number

  /**
   * Trạng thái hiển thị
   * @example "DRAFT"
   */
  @IsRequiredEnumValue(ExamVisibility, 'Trạng thái hiển thị')
  visibility: ExamVisibility

  /**
   * Mô tả đề thi
   * @example "Đề thi giữa kỳ môn Toán lớp 10"
   */
  @IsOptionalString('Mô tả', 2000)
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
   * Loại đề thi
   * @example "CK1"
   */
  @IsOptionalEnumValue(TypeOfExam, 'Loại đề thi')
  typeOfExam?: TypeOfExam

  /**
   * Danh sách ID câu hỏi
   * @example [1, 2, 3, 4, 5]
   */
  @IsOptionalIntArray('Danh sách ID câu hỏi')
  questionIds?: number[]
}
