import { IsOptional, IsUrl, MaxLength } from 'class-validator'
import {
  IsOptionalIdNumber,
  IsOptionalString,
  IsRequiredEnumValue,
} from 'src/shared/decorators/validate'
import { ReportReason, ReportTargetType } from 'src/shared/enums'

export class CreateReportDto {
  @IsRequiredEnumValue(ReportTargetType, 'Loại đối tượng báo cáo')
  targetType: ReportTargetType

  @IsRequiredEnumValue(ReportReason, 'Lý do báo cáo')
  reason: ReportReason

  @IsOptionalString('Mô tả', 5000)
  description?: string

  @IsOptionalIdNumber('reportedAdminId')
  reportedAdminId?: number

  @IsOptionalIdNumber('questionId')
  questionId?: number

  @IsOptionalIdNumber('examId')
  examId?: number

  @IsOptionalIdNumber('classId')
  classId?: number

  @IsOptionalIdNumber('sessionId')
  sessionId?: number

  @IsOptional()
  @IsUrl({ require_protocol: true }, { message: 'pageUrl phải là URL hợp lệ, gồm http:// hoặc https://' })
  @MaxLength(1000, { message: 'pageUrl không được vượt quá 1000 ký tự' })
  pageUrl?: string
}
