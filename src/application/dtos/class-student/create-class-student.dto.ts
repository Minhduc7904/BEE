import { IsRequiredIdNumber, IsOptionalIdNumber } from 'src/shared/decorators/validate'

/**
 * DTO thêm học sinh vào lớp
 * @description Chứa thông tin để thêm học sinh vào lớp học
 */
export class CreateClassStudentDto {
  /**
   * ID lớp học
   * @required
   * @example 5
   */
  @IsRequiredIdNumber('ID lớp học')
  classId: number

  /**
   * ID học sinh
   * @optional
   * @example 10
   */
  @IsOptionalIdNumber('ID học sinh')
  studentId?: number
}
