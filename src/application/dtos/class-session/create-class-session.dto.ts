import { IsRequiredIdNumber, IsRequiredString, IsRequiredDate, IsOptionalString } from 'src/shared/decorators/validate'

/**
 * DTO tạo buổi học mới
 * @description Chứa thông tin để tạo một buổi học trong lớp
 */
export class CreateClassSessionDto {
  /**
   * ID lớp học
   * @required
   * @example 5
   */
  @IsRequiredIdNumber('ID lớp học')
  classId: number

  /**
   * Tên buổi học (tối đa 200 ký tự)
   * @required
   * @example "Buổi 1: Giới thiệu toán học"
   */
  @IsRequiredString('Tên buổi học', 200)
  name: string

  /**
   * Ngày học
   * @required
   * @example "2024-01-15"
   */
  @IsRequiredDate('Ngày học')
  sessionDate: string

  /**
   * Giờ bắt đầu
   * @required
   * @example "08:00:00"
   */
  @IsRequiredDate('Giờ bắt đầu')
  startTime: string

  /**
   * Giờ kết thúc
   * @required
   * @example "10:00:00"
   */
  @IsRequiredDate('Giờ kết thúc')
  endTime: string

  /**
   * Ghi chú học bù
   * @optional
   * @example "Buổi học bù cho ngày 10/01"
   */
  @IsOptionalString('Ghi chú học bù')
  makeupNote?: string
}
