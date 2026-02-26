import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  Max,
  IsArray,
  ValidateNested,
  ArrayNotEmpty,
  IsDate,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TuitionPaymentStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

/**
 * Item cho mỗi học phí
 */
export class TuitionPaymentItemDto {
  @ToNumber()
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  @Min(1, { message: 'ID học sinh phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID học sinh không được để trống' })
  studentId: number

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Số tiền phải là số nguyên' })
  @Min(0, { message: 'Số tiền học phí phải lớn hơn hoặc bằng 0' })
  amount?: number | null // null = chưa xác định, 0 = miễn phí

  @ToNumber()
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
  @IsNotEmpty({ message: 'Tháng không được để trống' })
  month: number

  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm không hợp lệ' })
  @IsNotEmpty({ message: 'Năm không được để trống' })
  year: number

  @IsEnum(TuitionPaymentStatus, {
    message: 'Trạng thái học phí không hợp lệ',
  })
  @IsNotEmpty({ message: 'Trạng thái học phí không được để trống' })
  status: TuitionPaymentStatus

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày thanh toán phải là ngày hợp lệ' })
  paidAt?: Date

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID khoá học phải là số nguyên' })
  @Min(1, { message: 'ID khoá học phải lớn hơn 0' })
  courseId?: number
}

/**
 * DTO cho việc tạo hàng loạt học phí với dữ liệu riêng cho từng học phí
 */
export class CreateArrayBulkTuitionPaymentDto {
  @IsArray({ message: 'Danh sách học phí phải là mảng' })
  @ArrayNotEmpty({ message: 'Danh sách học phí không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => TuitionPaymentItemDto)
  payments: TuitionPaymentItemDto[]
}
