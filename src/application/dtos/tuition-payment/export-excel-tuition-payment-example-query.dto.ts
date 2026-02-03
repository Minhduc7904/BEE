import { IsRequiredInt } from 'src/shared/decorators/validate'

/**
 * DTO for exporting tuition payment example Excel file
 * 
 * @description Parameters for generating a template Excel file for tuition payment import
 */
export class ExportExcelTuitionPaymentExampleQueryDto {
  /**
   * Year (min: 2000)
   * @required
   * @example 2024
   */
  @IsRequiredInt('Năm', 2000)
  year: number

  /**
   * Month (1-12)
   * @required
   * @example 6
   */
  @IsRequiredInt('Tháng', 1, 12)
  month: number
}
