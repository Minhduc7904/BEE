import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { IsOptionalString, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật section tạm
 * @description Chứa các trường có thể cập nhật của section
 */
export class UpdateTempSectionDto {
  /**
   * Tiêu đề section (1-255 ký tự)
   * @optional
   * @example "Phần I: Trắc nghiệm"
   */
  @IsOptionalString('Tiêu đề section', 255, 1)
  title?: string

  /**
   * Mô tả section
   * @optional
   * @example "Các câu hỏi trắc nghiệm 4 đáp án"
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Thứ tự hiển thị
   * @optional
   * @example 1
   */
  @IsOptionalInt('Thứ tự')
  order?: number

  /**
   * Dữ liệu metadata
   * @optional
   */
  @IsOptionalString('Metadata')
  metadata?: any
}
