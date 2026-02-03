import { IsRequiredIdNumber, IsRequiredEnumValue, IsRequiredNumber, IsRequiredString, IsOptionalEnumValue, IsOptionalNumber, IsOptionalString } from 'src/shared/decorators/validate'

export enum PointType {
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

/**
 * DTO for creating student point log
 * 
 * @description Used to record bonus or penalty points for a student
 */
export class CreateStudentPointLogDto {
  /**
   * Student ID
   * @required
   * @example 10
   */
  @IsRequiredIdNumber('ID học sinh')
  studentId: number

  /**
   * Point type (bonus or penalty)
   * @required
   * @example PointType.BONUS
   */
  @IsRequiredEnumValue(PointType, 'Loại điểm')
  type: PointType

  /**
   * Points amount (minimum 0)
   * @required
   * @example 10
   */
  @IsRequiredNumber('Điểm số', 0)
  points: number

  /**
   * Point source/reason
   * @required
   * @example 'Excellent behavior in class'
   */
  @IsRequiredString('Nguồn điểm', 255)
  source: string

  /**
   * Additional notes
   * @optional
   * @example 'Helped other students'
   */
  @IsOptionalString('Ghi chú', 500)
  note?: string
}

/**
 * DTO for updating student point log
 * 
 * @description Used to update an existing point log entry
 */
export class UpdateStudentPointLogDto {
  /**
   * Point type (bonus or penalty)
   * @optional
   * @example PointType.PENALTY
   */
  @IsOptionalEnumValue(PointType, 'Loại điểm')
  type?: PointType

  /**
   * Points amount (minimum 0)
   * @optional
   * @example 5
   */
  @IsOptionalNumber('Điểm số', 0)
  points?: number

  /**
   * Point source/reason
   * @optional
   * @example 'Late to class'
   */
  @IsOptionalString('Nguồn điểm', 255)
  source?: string

  /**
   * Additional notes
   * @optional
   * @example 'Updated reason'
   */
  @IsOptionalString('Ghi chú', 500)
  note?: string
}
