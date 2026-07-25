import {
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalString,
  IsRequiredIdNumber,
  IsRequiredInt,
  IsRequiredString,
} from '../../../../shared/decorators/validate'

export class CreateBaseAssistantShiftDto {
  @IsRequiredIdNumber('ID chuỗi ca')
  assistantShiftSeriesId!: number

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
