import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { ReportResponseDto } from 'src/application/dtos/report/report-response.dto'
import { UpdateReportDto } from 'src/application/dtos/report/update-report.dto'
import type { UpdateReportData } from 'src/domain/interface/report/report.interface'
import type { IReportRepository } from 'src/domain/repositories/report.repository'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateReportUseCase {
  constructor(@Inject('IReportRepository') private readonly reportRepository: IReportRepository) {}

  async execute(reportId: number, dto: UpdateReportDto, adminId: number): Promise<BaseResponseDto<ReportResponseDto>> {
    const existing = await this.reportRepository.findById(reportId)
    if (!existing) throw new NotFoundException(`Không tìm thấy báo cáo có ID ${reportId}`)

    const data: UpdateReportData = {
      handledById: adminId,
      handledAt: new Date(),
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'reason')) data.reason = dto.reason
    if (Object.prototype.hasOwnProperty.call(dto, 'description')) data.description = dto.description?.trim() || null
    if (Object.prototype.hasOwnProperty.call(dto, 'status')) data.status = dto.status
    if (Object.prototype.hasOwnProperty.call(dto, 'resolutionNote')) data.resolutionNote = dto.resolutionNote?.trim() || null

    const report = await this.reportRepository.update(reportId, data)
    return BaseResponseDto.success('Cập nhật báo cáo thành công', new ReportResponseDto(report))
  }
}
