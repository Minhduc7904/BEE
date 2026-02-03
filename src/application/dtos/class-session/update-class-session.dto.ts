import { IsOptionalString, IsOptionalDate } from 'src/shared/decorators/validate'

/**
 * DTO cập nhật buổi học
 * @description Chứa các trường có thể cập nhật của buổi học
 */
export class UpdateClassSessionDto {
  /**
   * Tên buổi học (tối đa 200 ký tự)
   * @optional
   * @example "Buổi 1: Giới thiệu toán học"
   */
  @IsOptionalString('Tên buổi học', 200)
  name?: string

  /**
   * Ngày học
   * @optional
   * @example "2024-01-15"
   */
  @IsOptionalDate('Ngày học')
  sessionDate?: string

  /**
   * Giờ bắt đầu
   * @optional
   * @example "08:00:00"
   */
  @IsOptionalDate('Giờ bắt đầu')
  startTime?: string

  /**
   * Giờ kết thúc
   * @optional
   * @example "10:00:00"
   */
  @IsOptionalDate('Giờ kết thúc')
  endTime?: string

  /**
   * Ghi chú học bù
   * @optional
   * @example "Buổi học bù cho ngày 10/01"
   */
  @IsOptionalString('Ghi chú học bù')
  makeupNote?: string
}
