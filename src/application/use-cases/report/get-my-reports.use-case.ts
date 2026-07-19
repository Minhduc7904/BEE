import { Inject, Injectable } from '@nestjs/common'
import { MyReportListQueryDto } from 'src/application/dtos/report/report-list-query.dto'
import { ReportListResponseDto, ReportResponseDto } from 'src/application/dtos/report/report-response.dto'
import type { IReportRepository } from 'src/domain/repositories/report.repository'

@Injectable()
export class GetMyReportsUseCase {
  constructor(@Inject('IReportRepository') private readonly reportRepository: IReportRepository) {}

  async execute(reporterId: number, query: MyReportListQueryDto): Promise<ReportListResponseDto> {
    const result = await this.reportRepository.findByReporterWithPagination(
      reporterId,
      query.toReportPagination(),
      query.toReportFilters(),
    )
    return new ReportListResponseDto(
      result.data.map((report) => new ReportResponseDto(report)),
      result.page,
      result.limit,
      result.total,
    )
  }
}
