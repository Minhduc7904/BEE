import { IsInt, Min, Max, IsOptional } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
export class MonthlyTuitionPaymentStatsQueryDto {
  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm phải từ 2000 trở lên' })
  @Max(2100, { message: 'Năm không được quá 2100' })
  year: number

  @ToNumber()
  @IsOptional()
  @IsInt({ message: 'courseId phải là số nguyên' })
  courseId?: number

  @ToNumber()
  @IsOptional()
  @IsInt({ message: 'studentId phải là số nguyên' })
  studentId?: number
}
