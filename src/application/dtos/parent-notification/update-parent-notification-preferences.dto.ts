import { IsOptionalBoolean } from '../../../shared/decorators/validate'

export class UpdateParentNotificationPreferencesDto {
  @IsOptionalBoolean('Thông báo điểm danh')
  attendanceEnabled?: boolean

  @IsOptionalBoolean('Thông báo kết quả')
  resultEnabled?: boolean

  @IsOptionalBoolean('Thông báo học phí')
  tuitionEnabled?: boolean
}
