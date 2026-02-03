import { IsOptionalBoolean } from 'src/shared/decorators/validate'
import { TuitionPaymentListQueryDto } from './tuition-payment-list-query.dto'

/**
 * DTO for customizing tuition payment export fields
 *
 * @description Used to configure which columns to include in tuition payment export
 */
export class ExportTuitionPaymentListOptionDto extends TuitionPaymentListQueryDto {
  /**
   * Include student name field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm tên học sinh')
  includeStudentName?: boolean = true

  /**
   * Include student phone field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm số điện thoại học sinh')
  includeStudentPhone?: boolean = true

  /**
   * Include parent phone field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm số điện thoại phụ huynh')
  includeParentPhone?: boolean = true

  /**
   * Include school field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm trường')
  includeSchool?: boolean = true

  /**
   * Include grade field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm khối')
  includeGrade?: boolean = true

  /**
   * Include amount field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm số tiền')
  includeAmount?: boolean = true

  /**
   * Include month field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm tháng')
  includeMonth?: boolean = true

  /**
   * Include year field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm năm')
  includeYear?: boolean = true

  /**
   * Include status field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm trạng thái')
  includeStatus?: boolean = true

  /**
   * Include paid at date field
   * @optional
   * @default true
   * @example true
   */
  @IsOptionalBoolean('Bao gồm ngày thanh toán')
  includePaidAt?: boolean = true

  /**
   * Include notes field
   * @optional
   * @default false
   * @example false
   */
  @IsOptionalBoolean('Bao gồm ghi chú')
  includeNotes?: boolean = false

  /**
   * Include created at timestamp field
   * @default true
   */
  @IsOptionalBoolean('Bao gồm ngày tạo')
  includeCreatedAt?: boolean = true
}
