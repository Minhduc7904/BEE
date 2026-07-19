import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { ReportResponseDto } from 'src/application/dtos/report/report-response.dto'
import type { IReportRepository } from 'src/domain/repositories/report.repository'
import { ForbiddenException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class GetReportByIdUseCase {
  constructor(@Inject('IReportRepository') private readonly reportRepository: IReportRepository) {}

  async execute(reportId: number): Promise<BaseResponseDto<ReportResponseDto>> {
    const report = await this.reportRepository.findById(reportId)
    if (!report) throw new NotFoundException(`Không tìm thấy báo cáo có ID ${reportId}`)
    return BaseResponseDto.success('Lấy chi tiết báo cáo thành công', new ReportResponseDto(report))
  }

  async executeForReporter(reportId: number, reporterId: number): Promise<BaseResponseDto<ReportResponseDto>> {
    const report = await this.reportRepository.findById(reportId)
    if (!report) throw new NotFoundException(`Không tìm thấy báo cáo có ID ${reportId}`)
    if (report.reporterId !== reporterId) {
      throw new ForbiddenException('Bạn không có quyền xem báo cáo này')
    }
    return BaseResponseDto.success('Lấy chi tiết báo cáo thành công', new ReportResponseDto(report))
  }
}
