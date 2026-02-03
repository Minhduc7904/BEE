import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { ExamVisibility } from '../../../shared/enums'
import { IsOptionalString, IsOptionalInt, IsOptionalIdNumber, IsOptionalEnumValue } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật đề thi tạm
 * @description Chứa các trường có thể cập nhật của đề thi tạm
 */
export class UpdateTempExamDto {
  /**
   * Tiêu đề đề thi (3-200 ký tự)
   * @optional
   * @example "Đề thi giữa kỳ Toán 10"
   */
  @IsOptionalString('Tiêu đề', 200, 3)
  title?: string

  /**
   * Mô tả đề thi
   * @optional
   * @example "Đề thi trắc nghiệm và tự luận"
   */
  @IsOptionalString('Mô tả')
  description?: string

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
   * Trạng thái hiển thị
   * @optional
   * @example "PUBLIC"
   */
  @IsOptionalEnumValue(ExamVisibility, 'Trạng thái hiển thị')
  visibility?: ExamVisibility

  /**
   * Link Youtube lời giải
   * @optional
   * @example "https://youtube.com/watch?v=xxx"
   */
  @IsOptionalString('Link Youtube lời giải')
  solutionYoutubeUrl?: string

  /**
   * Dữ liệu metadata
   * @optional
   */
  @IsOptionalString('Metadata')
  metadata?: any

  /**
   * Nội dung thô
   * @optional
   */
  @IsOptionalString('Nội dung thô')
  rawContent?: string
}
