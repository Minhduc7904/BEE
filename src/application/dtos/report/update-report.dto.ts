import { IsOptionalEnumValue, IsOptionalString } from 'src/shared/decorators/validate'
import { ReportReason, ReportStatus } from 'src/shared/enums'

export class UpdateReportDto {
  @IsOptionalEnumValue(ReportReason, 'Lý do báo cáo')
  reason?: ReportReason

  @IsOptionalString('Mô tả', 5000)
  description?: string | null

  @IsOptionalEnumValue(ReportStatus, 'Trạng thái báo cáo')
  status?: ReportStatus

  @IsOptionalString('Ghi chú xử lý', 5000)
  resolutionNote?: string | null
}
