import {
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  IsString,
  Min,
  Max,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator'
import { TuitionPaymentStatus } from 'src/shared/enums'
import { ToNumber } from 'src/shared/decorators'

export class CreateBulkTuitionPaymentDto {
  /**
   * Tạo học phí cho toàn bộ học sinh trong khoá học
   */
  @ValidateIf(o => !o.studentIds && !o.grade)
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID khoá học phải là số nguyên' })
  @Min(1, { message: 'ID khoá học phải lớn hơn 0' })
  courseId?: number

  /**
   * Hoặc tạo cho danh sách học sinh cụ thể
   */
  @ValidateIf(o => !o.courseId && !o.grade)
  @IsOptional()
  @IsArray({ message: 'Danh sách học sinh phải là mảng' })
  @ArrayNotEmpty({ message: 'Danh sách học sinh không được rỗng' })
  @IsInt({ each: true, message: 'ID học sinh phải là số nguyên' })
  studentIds?: number[]

  /**
   * Hoặc tạo theo khối (grade)
   */
  @ValidateIf(o => !o.courseId && !o.studentIds)
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Grade phải là số nguyên' })
  @Min(1, { message: 'Grade phải lớn hơn 0' })
  @Max(12, { message: 'Grade phải nhỏ hơn hoặc bằng 12' })
  grade?: number

  /**
   * Tháng học phí
   */
  @ToNumber()
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
  month: number

  /**
   * Năm học phí
   */
  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  @Min(2000, { message: 'Năm không hợp lệ' })
  year: number

  /**
   * Trạng thái mặc định
   */
  @IsOptional()
  @IsEnum(TuitionPaymentStatus, {
    message: 'Trạng thái học phí không hợp lệ',
  })
  status?: TuitionPaymentStatus

  /**
   * Ghi chú chung
   */
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string
}
