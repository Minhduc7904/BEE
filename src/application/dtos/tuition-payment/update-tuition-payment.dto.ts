import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator'
import { TuitionPaymentStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class UpdateTuitionPaymentDto {
  @IsOptional()
  @IsEnum(TuitionPaymentStatus, { message: 'Trạng thái học phí không hợp lệ' })
  status?: TuitionPaymentStatus

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
  month?: number

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm không hợp lệ' })
  year?: number

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string
}
