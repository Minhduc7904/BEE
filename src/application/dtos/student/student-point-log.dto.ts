import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator'
import { Trim } from '../../../shared/decorators'
import { VALIDATION_MESSAGES } from '../../../shared/constants'

export enum PointType {
  BONUS = 'BONUS',
  PENALTY = 'PENALTY',
}

export class CreateStudentPointLogDto {
  @IsNumber()
  @Min(1, { message: 'Student ID phải lớn hơn 0' })
  studentId: number

  @IsEnum(PointType, { message: 'Loại điểm không hợp lệ' })
  type: PointType

  @IsNumber()
  @Min(0, { message: 'Điểm số phải lớn hơn hoặc bằng 0' })
  points: number

  @Trim()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_REQUIRED('Nguồn điểm') })
  @MaxLength(255, { message: VALIDATION_MESSAGES.FIELD_MAX('Nguồn điểm', 255) })
  source: string

  @Trim()
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FIELD_INVALID('Ghi chú') })
  @MaxLength(500, { message: VALIDATION_MESSAGES.FIELD_MAX('Ghi chú', 500) })
  note?: string
}

export class UpdateStudentPointLogDto {
  @IsOptional()
  @IsEnum(PointType, { message: 'Loại điểm không hợp lệ' })
  type?: PointType

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Điểm số phải lớn hơn hoặc bằng 0' })
  points?: number

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string
}
