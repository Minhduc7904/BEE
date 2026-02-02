// src/application/dtos/exam-import-session/exam-import-session.dto.ts
import { ImportStatus } from '../../../shared/enums'
import { PaginationResponseDto } from '../pagination/pagination-response.dto'
import { BaseResponseDto } from '../common/base-response.dto'
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator'
import { Trim } from '../../../shared/decorators'

export class ExamImportSessionResponseDto {
  sessionId: number
  status: ImportStatus
  rawContent?: string
  metadata?: any
  createdBy: number
  approvedBy?: number
  approvedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date

  // Relations
  tempExam?: any
  tempSections?: any[]
  tempQuestions?: any[]

  constructor(partial: Partial<ExamImportSessionResponseDto>) {
    Object.assign(this, partial)
  }

  /**
   * Factory method tạo từ ExamImportSession entity
   */
  static fromEntity(session: any): ExamImportSessionResponseDto {
    return new ExamImportSessionResponseDto({
      sessionId: session.sessionId,
      status: session.status,
      rawContent: session.rawContent,
      metadata: session.metadata,
      createdBy: session.createdBy,
      approvedBy: session.approvedBy,
      approvedAt: session.approvedAt,
      completedAt: session.completedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      tempExam: session.tempExam,
      tempSections: session.tempSections,
      tempQuestions: session.tempQuestions,
    })
  }

  /**
   * Hiển thị trạng thái
   */
  get statusDisplay(): string {
    const statusMap: Record<ImportStatus, string> = {
      [ImportStatus.PENDING]: 'Đang chờ',
      [ImportStatus.PROCESSING]: 'Đang xử lý',
      [ImportStatus.PARSED]: 'Đã phân tích',
      [ImportStatus.REVIEWING]: 'Đang duyệt',
      [ImportStatus.APPROVED]: 'Đã duyệt',
      [ImportStatus.COMPLETED]: 'Hoàn thành',
      [ImportStatus.MIGRATING]: 'Đang di chuyển',
      [ImportStatus.REJECTED]: 'Từ chối',
      [ImportStatus.FAILED]: 'Thất bại',
    }
    return statusMap[this.status] || this.status
  }
}

export class ExamImportSessionListResponseDto extends PaginationResponseDto<ExamImportSessionResponseDto> {
  declare data: ExamImportSessionResponseDto[]
}

export class UpdateExamImportSessionDto {
  @IsOptional()
  @IsEnum(ImportStatus, { message: 'Trạng thái không hợp lệ' })
  status?: ImportStatus

  @IsOptional()
  @IsString({ message: 'Nội dung không hợp lệ' })
  rawContent?: string

  @IsOptional()
  metadata?: any
}
