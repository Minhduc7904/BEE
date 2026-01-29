import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator'
import { TuitionPaymentStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class CreateTuitionPaymentDto {
  @ToNumber()
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  @Min(1, { message: 'ID học sinh phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID học sinh không được để trống' })
  studentId: number

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID khoá học phải là số nguyên' })
  @Min(1, { message: 'ID khoá học phải lớn hơn 0' })
  courseId?: number

  /**
   * 💰 Số tiền học phí (snapshot)
   */
  @ToNumber()
  @IsInt({ message: 'Số tiền phải là số nguyên' })
  @Min(1, { message: 'Số tiền học phí phải lớn hơn 0' })
  @IsNotEmpty({ message: 'Số tiền học phí không được để trống' })
  amount: number

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

  @IsEnum(TuitionPaymentStatus, {
    message: 'Trạng thái học phí không hợp lệ',
  })
  @IsNotEmpty({ message: 'Trạng thái học phí không được để trống' })
  status: TuitionPaymentStatus

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string
}
