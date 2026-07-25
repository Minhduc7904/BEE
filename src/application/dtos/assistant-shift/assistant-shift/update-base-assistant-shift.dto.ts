import { IsOptionalIdNumber, IsOptionalInt, IsOptionalString } from '../../../../shared/decorators/validate'

export class UpdateBaseAssistantShiftDto {
  @IsOptionalIdNumber('ID lớp')
  classId?: number

  @IsOptionalString('Tên ca', 200)
  name?: string

  @IsOptionalString('Ghi chú')
  notes?: string

  @IsOptionalString('Giờ bắt đầu', 5, 5)
  startTime?: string

  @IsOptionalString('Giờ kết thúc', 5, 5)
  endTime?: string

  @IsOptionalInt('Số trợ giảng cần', 1)
  requiredAssistantCount?: number
}
