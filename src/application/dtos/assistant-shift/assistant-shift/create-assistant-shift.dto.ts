import {
  IsOptionalBoolean,
  IsOptionalDate,
  IsOptionalIdNumber,
  IsOptionalInt,
  IsOptionalString,
  IsRequiredDate,
  IsRequiredIdNumber,
  IsRequiredInt,
  IsRequiredString,
} from '../../../../shared/decorators/validate'

export class CreateAssistantShiftDto {
  @IsRequiredIdNumber('ID chuỗi ca')
  assistantShiftSeriesId!: number

  @IsOptionalIdNumber('ID lớp')
  classId?: number

  @IsRequiredString('Tên ca', 200)
  name!: string

  @IsOptionalString('Ghi chú')
  notes?: string

  @IsRequiredDate('Thời gian bắt đầu')
  startAt!: string

  @IsRequiredDate('Thời gian kết thúc')
  endAt!: string

  @IsRequiredInt('Số trợ giảng cần', 1)
  requiredAssistantCount!: number

  @IsOptionalBoolean('Trạng thái khóa')
  isLocked?: boolean

  @IsOptionalDate('Mở tự đăng ký lúc')
  selfRegistrationOpenAt?: string | null

  @IsOptionalDate('Đóng tự đăng ký lúc')
  selfRegistrationCloseAt?: string | null
}
