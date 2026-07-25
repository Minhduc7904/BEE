import {
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalString,
  IsRequiredInt,
  IsRequiredString,
} from '../../../../shared/decorators/validate'

export class CreateBaseAssistantShiftDto {
  @IsOptionalIdNumber('ID lớp')
  classId?: number

  @IsRequiredString('Tên ca', 200)
  name!: string

  @IsOptionalString('Ghi chú')
  notes?: string

  @IsRequiredInt('Thứ trong tuần', 1, 7)
  weekday!: number

  @IsRequiredString('Giờ bắt đầu', 5, 5)
  startTime!: string

  @IsRequiredString('Giờ kết thúc', 5, 5)
  endTime!: string

  @IsRequiredInt('Số trợ giảng cần', 1)
  requiredAssistantCount!: number
}
