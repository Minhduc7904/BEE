// src/application/dtos/exam-import-session/exam-import-session-list-query.dto.ts
import { IsOptional, IsEnum, IsNumber } from 'class-validator'
import { ListQueryDto } from '../pagination/list-query.dto'
import { ToNumber } from '../../../shared/decorators'
import { ImportStatus } from '../../../shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export class ExamImportSessionListQueryDto extends ListQueryDto {
  @IsOptional()
  @IsEnum(ImportStatus, { message: 'Trạng thái không hợp lệ' })
  status?: ImportStatus

  @IsOptional()
  @ToNumber()
  @IsNumber({}, { message: 'ID người tạo không hợp lệ' })
  createdBy?: number

  /**
   * Chuyển đổi DTO thành filter options cho repository
   */
  toFilterOptions() {
    return {
      status: this.status,
      createdBy: this.createdBy,
      search: this.search,
      fromDate: this.fromDate,
      toDate: this.toDate,
    }
  }

  /**
   * Chuyển đổi thành pagination options cho repository
   */
  toPaginationOptions() {
    const sortField = this.sortBy || 'createdAt'
    const sortDirection = this.sortOrder || SortOrder.DESC

    // Validate sort field
    const allowedSortFields = [
      'sessionId',
      'fileName',
      'status',
      'createdBy',
      'createdAt',
      'updatedAt',
      'approvedAt',
      'completedAt',
    ]

    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'createdAt'

    return {
      skip: ((this.page || 1) - 1) * (this.limit || 10),
      take: this.limit || 10,
      sortBy: validSortField,
      sortOrder: sortDirection,
    }
  }
}
