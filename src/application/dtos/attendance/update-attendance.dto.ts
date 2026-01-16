import { IsOptional, IsEnum, IsString } from 'class-validator'
import { AttendanceStatus } from 'src/shared/enums'

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus, { message: 'Trạng thái điểm danh không hợp lệ' })
  status?: AttendanceStatus

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string
}
