import { IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { ListQueryDto } from '../pagination/list-query.dto'
import { TuitionPaymentStatus } from 'src/shared/enums'
import {
  TuitionPaymentFilterOptions,
  TuitionPaymentPaginationOptions,
} from '../../../domain/interface/tuition-payment/tuition-payment.interface'
import { ToNumber, EmptyToUndefined } from 'src/shared/decorators'

export class TuitionPaymentListQueryDto extends ListQueryDto {
  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  studentId?: number

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'ID khoá học phải là số nguyên' })
  courseId?: number

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Tháng phải là số nguyên' })
  @Min(1, { message: 'Tháng phải từ 1 đến 12' })
  @Max(12, { message: 'Tháng phải từ 1 đến 12' })
  month?: number

  @IsOptional()
  @ToNumber()
  @IsInt({ message: 'Năm phải là số nguyên' })
  year?: number

  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(TuitionPaymentStatus, {
    message: 'Trạng thái học phí không hợp lệ',
  })
  status?: TuitionPaymentStatus

  // ======================
  // MAP → DOMAIN FILTER
  // ======================

  toTuitionPaymentFilterOptions(): TuitionPaymentFilterOptions {
    return {
      studentId: this.studentId,
      courseId: this.courseId,
      month: this.month,
      year: this.year,
      status: this.status,

      fromPaidAt: this.fromDate ? new Date(this.fromDate) : undefined,
      toPaidAt: this.toDate ? new Date(this.toDate) : undefined,
    }
  }

  // ======================
  // MAP → PAGINATION
  // ======================

  toTuitionPaymentPaginationOptions(): TuitionPaymentPaginationOptions {
    const allowedSortFields = ['paymentId', 'createdAt', 'updatedAt', 'paidAt', 'status', 'month', 'year']

    const sortBy = allowedSortFields.includes(this.sortBy || '') ? this.sortBy : 'createdAt'

    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy,
      sortOrder: this.sortOrder,
    }
  }
}
