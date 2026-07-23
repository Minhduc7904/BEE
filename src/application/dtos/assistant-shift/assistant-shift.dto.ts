import { AssistantShift, AssistantShiftAssignment, AssistantShiftSeries } from '../../../domain/entities/assistant-shift'
import { CourseClassResponseDto } from '../course-class/course-class.dto'
import { AssistantShiftAssignmentAttendanceStatus } from '../../../shared/enums'
import { IsOptionalBoolean, IsOptionalDate, IsOptionalEnumValue, IsOptionalIdNumber, IsOptionalInt, IsOptionalString, IsRequiredDate, IsRequiredIdNumber, IsRequiredInt, IsRequiredString } from '../../../shared/decorators/validate'

export class AssistantShiftSeriesResponseDto {
  assistantShiftSeriesId: number
  name: string
  isLocked: boolean
  constructor(entity: AssistantShiftSeries) { this.assistantShiftSeriesId = entity.assistantShiftSeriesId; this.name = entity.name; this.isLocked = entity.isLocked }
}

export class AssistantShiftAssignmentResponseDto {
  assistantShiftId: number
  adminId: number
  attendanceStatus: AssistantShiftAssignmentAttendanceStatus
  absenceReason: string | null
  managerNote: string | null
  admin?: { adminId: number; userId: number; fullName: string; avatarUrl?: string }
  constructor(entity: AssistantShiftAssignment) {
    this.assistantShiftId = entity.assistantShiftId; this.adminId = entity.adminId; this.attendanceStatus = entity.attendanceStatus
    this.absenceReason = entity.absenceReason ?? null; this.managerNote = entity.managerNote ?? null
    if (entity.admin) this.admin = { adminId: entity.admin.adminId, userId: entity.admin.userId, fullName: entity.admin.getFullName() }
  }
}

export class AssistantShiftResponseDto {
  assistantShiftId: number; assistantShiftSeriesId: number; classId: number | null; name: string; notes: string | null; startAt: Date; endAt: Date; isLocked: boolean; selfRegistrationOpenAt: Date | null; selfRegistrationCloseAt: Date | null; requiredAssistantCount: number
  series?: AssistantShiftSeriesResponseDto; assignments?: AssistantShiftAssignmentResponseDto[]; courseClass?: CourseClassResponseDto
  constructor(entity: AssistantShift) {
    this.assistantShiftId = entity.assistantShiftId; this.assistantShiftSeriesId = entity.assistantShiftSeriesId; this.classId = entity.classId ?? null; this.name = entity.name; this.notes = entity.notes ?? null; this.startAt = entity.startAt; this.endAt = entity.endAt; this.isLocked = entity.isLocked; this.selfRegistrationOpenAt = entity.selfRegistrationOpenAt; this.selfRegistrationCloseAt = entity.selfRegistrationCloseAt; this.requiredAssistantCount = entity.requiredAssistantCount
    if (entity.series) this.series = new AssistantShiftSeriesResponseDto(entity.series)
    if (entity.assignments) this.assignments = entity.assignments.map((item) => new AssistantShiftAssignmentResponseDto(item))
    if (entity.courseClass) this.courseClass = new CourseClassResponseDto(entity.courseClass)
  }
}

export class AssistantShiftDateRangeQueryDto {
  @IsRequiredDate('Ngày bắt đầu') startAt!: string
  @IsRequiredDate('Ngày kết thúc') endAt!: string
  toRange(): { startAtFrom: Date; startAtTo: Date } {
    const startAtFrom = new Date(this.startAt); startAtFrom.setDate(startAtFrom.getDate() - 1); startAtFrom.setHours(0, 0, 0, 0)
    const startAtTo = new Date(this.endAt); startAtTo.setHours(23, 59, 59, 999)
    return { startAtFrom, startAtTo }
  }
}

export class AssistantShiftAllBySeriesQueryDto extends AssistantShiftDateRangeQueryDto {
  @IsOptionalIdNumber('ID trợ giảng') adminId?: number
}

export class AssistantShiftAssistantStatisticsItemDto {
  adminId: number
  userId: number
  fullName: string
  registeredShiftCount: number
  workedHours: number
  absentHours: number
  pendingHours: number
}

export class AssistantShiftAssistantStatisticsResponseDto {
  startAt: Date
  endAt: Date
  assistants: AssistantShiftAssistantStatisticsItemDto[]
}

export class AssistantShiftRangeDto {
  @IsRequiredDate('Thời gian bắt đầu') startAt!: string
  @IsRequiredDate('Thời gian kết thúc') endAt!: string
}

export class CopyAssistantShiftsDto {
  @IsRequiredDate('Thời gian bắt đầu sao chép') startCopyAt!: string
  @IsRequiredDate('Thời gian kết thúc sao chép') endCopyAt!: string
  @IsRequiredDate('Thời gian bắt đầu dán') startPasteAt!: string
  @IsRequiredDate('Thời gian kết thúc dán') endPasteAt!: string
  @IsOptionalBoolean('Sao chép phân công trợ giảng') copyAssignments?: boolean
}

export class SetAssistantShiftSelfRegistrationWindowDto extends AssistantShiftRangeDto {
  @IsRequiredDate('Thời gian mở tự đăng ký') selfRegistrationOpenAt!: string
  @IsRequiredDate('Thời gian đóng tự đăng ký') selfRegistrationCloseAt!: string
}

export class CreateAssistantShiftSeriesDto { @IsRequiredString('Tên chuỗi ca', 200) name!: string; @IsOptionalBoolean('Trạng thái khóa') isLocked?: boolean }
export class UpdateAssistantShiftSeriesDto { @IsOptionalString('Tên chuỗi ca', 200) name?: string; @IsOptionalBoolean('Trạng thái khóa') isLocked?: boolean }

export class CreateAssistantShiftDto {
  @IsRequiredIdNumber('ID chuỗi ca') assistantShiftSeriesId!: number
  @IsOptionalIdNumber('ID lớp') classId?: number
  @IsRequiredString('Tên ca', 200) name!: string
  @IsOptionalString('Ghi chú') notes?: string
  @IsRequiredDate('Thời gian bắt đầu') startAt!: string
  @IsRequiredDate('Thời gian kết thúc') endAt!: string
  @IsRequiredInt('Số trợ giảng cần', 1) requiredAssistantCount!: number
  @IsOptionalBoolean('Trạng thái khóa') isLocked?: boolean
  @IsOptionalDate('Mở tự đăng ký lúc') selfRegistrationOpenAt?: string
  @IsOptionalDate('Đóng tự đăng ký lúc') selfRegistrationCloseAt?: string
}
export class UpdateAssistantShiftDto {
  @IsOptionalIdNumber('ID chuỗi ca') assistantShiftSeriesId?: number; @IsOptionalIdNumber('ID lớp') classId?: number; @IsOptionalString('Tên ca', 200) name?: string; @IsOptionalString('Ghi chú') notes?: string; @IsOptionalDate('Thời gian bắt đầu') startAt?: string; @IsOptionalDate('Thời gian kết thúc') endAt?: string; @IsOptionalInt('Số trợ giảng cần', 1) requiredAssistantCount?: number; @IsOptionalBoolean('Trạng thái khóa') isLocked?: boolean; @IsOptionalDate('Mở tự đăng ký lúc') selfRegistrationOpenAt?: string; @IsOptionalDate('Đóng tự đăng ký lúc') selfRegistrationCloseAt?: string
}
export class CreateAssistantShiftAssignmentDto { @IsRequiredIdNumber('ID trợ giảng') adminId!: number; @IsOptionalEnumValue(AssistantShiftAssignmentAttendanceStatus, 'Trạng thái chấm công') attendanceStatus?: AssistantShiftAssignmentAttendanceStatus; @IsOptionalString('Lý do vắng') absenceReason?: string; @IsOptionalString('Ghi chú quản lý') managerNote?: string }
export class UpdateAssistantShiftAssignmentDto { @IsOptionalEnumValue(AssistantShiftAssignmentAttendanceStatus, 'Trạng thái chấm công') attendanceStatus?: AssistantShiftAssignmentAttendanceStatus; @IsOptionalString('Lý do vắng') absenceReason?: string; @IsOptionalString('Ghi chú quản lý') managerNote?: string }
