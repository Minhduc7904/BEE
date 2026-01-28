import { IsInt, IsOptional, Min, Max } from 'class-validator'
import { ToNumber } from 'src/shared/decorators'
import { TuitionPaymentFilterOptions } from 'src/domain/interface/tuition-payment/tuition-payment.interface'

export class TuitionPaymentStatsQueryDto {
  /**
   * Lọc theo khóa học (ADMIN)
   */
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID khóa học phải là số nguyên' })
  @Min(1, { message: 'ID khóa học phải lớn hơn 0' })
  courseId?: number

  /**
   * Lọc theo học sinh (ADMIN)
   */
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  @Min(1, { message: 'ID học sinh phải lớn hơn 0' })
  studentId?: number

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

  /**
   * Map sang domain filter
   */
  toFilterOptions(): TuitionPaymentFilterOptions {
    return {
      courseId: this.courseId,
      studentId: this.studentId,
      year: this.year,
      month: this.month,
    }
  }
}
