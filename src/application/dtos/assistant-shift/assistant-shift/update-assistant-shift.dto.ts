import {
  IsOptionalBoolean,
  IsOptionalDate,
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalString,
} from '../../../../shared/decorators/validate'

export class UpdateAssistantShiftDto {
  @IsOptionalIdNumber('ID chuỗi ca')
  assistantShiftSeriesId?: number

  @IsOptionalIdNumber('ID lớp')
  classId?: number

  @IsOptionalString('Tên ca', 200)
  name?: string

  @IsOptionalString('Ghi chú')
  notes?: string

  @IsOptionalDate('Thời gian bắt đầu')
  startAt?: string

  @IsOptionalDate('Thời gian kết thúc')
  endAt?: string

  @IsOptionalInt('Số trợ giảng cần', 1)
  requiredAssistantCount?: number

  @IsOptionalBoolean('Trạng thái khóa')
  isLocked?: boolean

  @IsOptionalDate('Mở tự đăng ký lúc')
  selfRegistrationOpenAt?: string | null

  @IsOptionalDate('Đóng tự đăng ký lúc')
  selfRegistrationCloseAt?: string | null
}
