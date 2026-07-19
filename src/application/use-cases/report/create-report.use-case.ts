import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CreateReportDto } from 'src/application/dtos/report/create-report.dto'
import { ReportResponseDto } from 'src/application/dtos/report/report-response.dto'
import type { CreateReportData, ReportTargetReference } from 'src/domain/interface/report/report.interface'
import type { IReportRepository } from 'src/domain/repositories/report.repository'
import { NotFoundException, ValidationException } from 'src/shared/exceptions/custom-exceptions'
import { ReportTargetType } from 'src/shared/enums'

@Injectable()
export class CreateReportUseCase {
  constructor(@Inject('IReportRepository') private readonly reportRepository: IReportRepository) {}

  async execute(dto: CreateReportDto, reporterId?: number): Promise<BaseResponseDto<ReportResponseDto>> {
    const target = this.validateTarget(dto)
    if (!(await this.reportRepository.targetExists(target))) {
      throw new NotFoundException('Đối tượng được báo cáo không tồn tại')
    }

    const report = await this.reportRepository.create({
      ...target,
      reporterId: reporterId ?? null,
      reason: dto.reason,
      description: dto.description?.trim() || null,
    })
    return BaseResponseDto.success('Gửi báo cáo thành công', new ReportResponseDto(report))
  }

  private validateTarget(dto: CreateReportDto): ReportTargetReference {
    const targetIds = [dto.reportedAdminId, dto.questionId, dto.examId, dto.classId, dto.sessionId]
      .filter((value) => value !== undefined && value !== null)

    const invalid = (message: string): never => { throw new ValidationException(message) }
    const hasOnlyTarget = (id?: number) => targetIds.length === 1 && id !== undefined && !dto.pageUrl

    switch (dto.targetType) {
      case ReportTargetType.ADMIN:
        if (!hasOnlyTarget(dto.reportedAdminId)) invalid('Báo cáo ADMIN chỉ phải có reportedAdminId')
        return { targetType: dto.targetType, reportedAdminId: dto.reportedAdminId }
      case ReportTargetType.QUESTION:
        if (!hasOnlyTarget(dto.questionId)) invalid('Báo cáo QUESTION chỉ phải có questionId')
        return { targetType: dto.targetType, questionId: dto.questionId }
      case ReportTargetType.EXAM:
        if (!hasOnlyTarget(dto.examId)) invalid('Báo cáo EXAM chỉ phải có examId')
        return { targetType: dto.targetType, examId: dto.examId }
      case ReportTargetType.CLASS:
        if (!hasOnlyTarget(dto.classId)) invalid('Báo cáo CLASS chỉ phải có classId')
        return { targetType: dto.targetType, classId: dto.classId }
      case ReportTargetType.CLASS_SESSION:
        if (!hasOnlyTarget(dto.sessionId)) invalid('Báo cáo CLASS_SESSION chỉ phải có sessionId')
        return { targetType: dto.targetType, sessionId: dto.sessionId }
      case ReportTargetType.WEBSITE:
        if (!dto.pageUrl || targetIds.length > 0) invalid('Báo cáo WEBSITE chỉ phải có pageUrl')
        return { targetType: dto.targetType, pageUrl: dto.pageUrl }
      default:
        return invalid('Loại đối tượng báo cáo không hợp lệ')
    }
  }
}
