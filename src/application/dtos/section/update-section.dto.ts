// src/application/dtos/section/update-section.dto.ts
import {
  IsOptionalString,
  IsOptionalInt,
} from 'src/shared/decorators/validate'

/**
 * DTO for updating a section
 *
 * @description Contains fields that can be updated for an existing section
 */
export class UpdateSectionDto {
  /**
   * Section title
   * @optional
   * @example "Phần 1: Trắc nghiệm (Updated)"
   */
  @IsOptionalString('Tiêu đề phần')
  title?: string

  /**
   * Section description
   * @optional
   * @example "Phần này gồm 25 câu trắc nghiệm"
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Order of section in exam
   * @optional
   * @example 2
   */
  @IsOptionalInt('Thứ tự', 1)
  order?: number
}
