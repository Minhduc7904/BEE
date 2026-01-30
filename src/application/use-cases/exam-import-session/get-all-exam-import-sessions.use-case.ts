// src/application/use-cases/exam-import-session/get-all-exam-import-sessions.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IExamImportSessionRepository } from '../../../domain/repositories/exam-import-session.repository'
import { ExamImportSessionListQueryDto } from '../../dtos/exam-import-session/exam-import-session-list-query.dto'
import {
  ExamImportSessionListResponseDto,
  ExamImportSessionResponseDto,
} from '../../dtos/exam-import-session/exam-import-session.dto'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'

@Injectable()
export class GetAllExamImportSessionsUseCase {
  constructor(
    @Inject('IExamImportSessionRepository')
    private readonly sessionRepository: IExamImportSessionRepository,
  ) {}

  async execute(query: ExamImportSessionListQueryDto): Promise<ExamImportSessionListResponseDto> {
    const filters = query.toFilterOptions()
    const pagination = query.toPaginationOptions()

    // Convert string dates to Date objects
    const findOptions = {
      ...filters,
      ...pagination,
      fromDate: filters.fromDate ? new Date(filters.fromDate) : undefined,
      toDate: filters.toDate ? new Date(filters.toDate) : undefined,
    }

    const result = await this.sessionRepository.findAll(findOptions)

    const sessions = result.data.map(ExamImportSessionResponseDto.fromEntity)

    return PaginationResponseDto.success(
      'Lấy danh sách phiên import thành công',
      sessions,
      query.page || 1,
      query.limit || 10,
      result.total,
    ) as ExamImportSessionListResponseDto
  }
}
