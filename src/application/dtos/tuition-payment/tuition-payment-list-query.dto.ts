import { IsOptionalIdNumber, IsOptionalInt, IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { ListQueryDto } from '../pagination/list-query.dto'
import { TuitionPaymentStatus } from 'src/shared/enums'
import {
  TuitionPaymentFilterOptions,
  TuitionPaymentPaginationOptions,
} from '../../../domain/interface/tuition-payment/tuition-payment.interface'
import { IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * DTO for querying tuition payment list
 * 
 * @description Extends ListQueryDto with tuition payment specific filters
 */
export class TuitionPaymentListQueryDto extends ListQueryDto {
  /**
   * Filter by student ID
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID học sinh')
  studentId?: number

  /**
   * Filter by course ID
   * @optional
   * @example 5
   */
  @IsOptionalIdNumber('ID khoá học')
  courseId?: number

  /**
   * Filter by month (1-12)
   * @optional
   * @example 6
   */
  @IsOptionalInt('Tháng', 1, 12)
  month?: number

  /**
   * Filter by year
   * @optional
   * @example 2024
   */
  @IsOptionalInt('Năm')
  year?: number

  /**
   * Filter by payment status
   * @optional
   * @example TuitionPaymentStatus.PAID
   */
  @IsOptionalEnumValue(TuitionPaymentStatus, 'Trạng thái học phí')
  status?: TuitionPaymentStatus

  /**
   * Filter by student grade (khối)
   * @optional
   * @example 10
   */
  @IsOptionalInt('Khối', 1, 12)
  grade?: number

  /**
   * Filter by minimum amount
   * @optional
   * @example 100000
   */
  @IsOptional()
  @Type(() => Number)
  minAmount?: number

  /**
   * Filter by maximum amount
   * @optional
   * @example 500000
   */
  @IsOptional()
  @Type(() => Number)
  maxAmount?: number

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
      grade: this.grade,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      search: this.search,

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
