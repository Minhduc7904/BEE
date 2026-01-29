import { IsInt, IsOptional, Min, Max } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
export class ExportExcelTuitionPaymentExampleQueryDto {
  /**
   * Lọc theo năm
   */
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm không hợp lệ' })
  year?: number

  /**
   * Lọc theo tháng
   */
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
  month?: number
}
