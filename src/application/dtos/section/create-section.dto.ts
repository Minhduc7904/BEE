// src/application/dtos/section/create-section.dto.ts
import {
  IsRequiredString,
  IsOptionalString,
  IsRequiredIdNumber,
  IsOptionalInt,
} from 'src/shared/decorators/validate'

/**
 * DTO for creating a section
 * 
 * @description Contains information to create a new section in an exam
 */
export class CreateSectionDto {
  /**
   * Exam ID
   * @required
   * @example 123
   */
  @IsRequiredIdNumber('ID đề thi')
  examId: number

  /**
   * Section title
   * @required
   * @example "Phần 1: Trắc nghiệm"
   */
  @IsRequiredString('Tiêu đề phần')
  title: string

  /**
   * Section description
   * @optional
   * @example "Phần này gồm 20 câu trắc nghiệm"
   */
  @IsOptionalString('Mô tả')
  description?: string

  /**
   * Order of section in exam
   * @optional - If not provided, will be automatically set to last position
   * @example 1
   */
  @IsOptionalInt('Thứ tự', 1)
  order?: number
}
