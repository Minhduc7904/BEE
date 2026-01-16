import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { AttendanceStatus } from 'src/shared/enums'

export class CreateAttendanceDto {
  @IsInt({ message: 'ID buổi học phải là số nguyên' })
  @Min(1, { message: 'ID buổi học phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID buổi học không được để trống' })
  sessionId: number

  @IsInt({ message: 'ID học sinh phải là số nguyên' })
  @Min(1, { message: 'ID học sinh phải lớn hơn 0' })
  @IsNotEmpty({ message: 'ID học sinh không được để trống' })
  studentId: number

  @IsEnum(AttendanceStatus, { message: 'Trạng thái điểm danh không hợp lệ' })
  @IsNotEmpty({ message: 'Trạng thái điểm danh không được để trống' })
  status: AttendanceStatus

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  notes?: string
}
