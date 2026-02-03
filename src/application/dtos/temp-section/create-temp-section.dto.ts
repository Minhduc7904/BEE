import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'
import { IsRequiredString, IsOptionalString, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO tạo section tạm
 * @description Chứa thông tin để tạo section (phần) trong đề thi tạm
 */
export class CreateTempSectionDto {
  /**
   * Tiêu đề section (1-255 ký tự)
   * @required
   * @example "Phần I: Trắc nghiệm"
   */
  @IsRequiredString('Tiêu đề section', 255, 1)
  title: string

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
