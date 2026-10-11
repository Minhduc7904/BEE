import { IsOptionalBoolean, IsRequiredDate, IsRequiredIntArray } from '../../../../shared/decorators/validate'

export class CopyBaseAssistantShiftsDto {
  @IsRequiredIntArray('Danh sách ID ca cơ sở')
  ids!: number[]

  @IsRequiredDate('Thời gian bắt đầu dán')
  startPasteAt!: string

  @IsRequiredDate('Thời gian kết thúc dán')
  endPasteAt!: string

  @IsOptionalBoolean('Sao chép phân công trợ giảng')
  copyAssignments?: boolean

  @IsOptionalBoolean('Sao chép trạng thái điểm danh của phân công')
  copyAssignmentAttendanceStatus?: boolean

  /** Tạo thêm buổi học (ClassSession) cho mỗi ca cơ sở đã gắn lớp. Cần quyền class-session:create. */
  @IsOptionalBoolean('Tạo buổi học cho các lớp')
  createClassSessions?: boolean
}
