import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import type { IReportRepository } from 'src/domain/repositories/report.repository'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteReportUseCase {
  constructor(@Inject('IReportRepository') private readonly reportRepository: IReportRepository) {}

  async execute(reportId: number): Promise<BaseResponseDto<null>> {
    const report = await this.reportRepository.findById(reportId)
    if (!report) throw new NotFoundException(`Không tìm thấy báo cáo có ID ${reportId}`)
    await this.reportRepository.delete(reportId)
    return BaseResponseDto.success('Xóa báo cáo thành công', null)
  }
}
