// src/application/dtos/question-chat/question-chat-list-query.dto.ts

import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalIdNumber } from 'src/shared/decorators/validate'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import type {
  QuestionChatPaginationOptions,
  QuestionChatFilterOptions,
} from '../../../domain/repositories/question-chat.repository'

/**
 * DTO for querying question chat list with filters and pagination
 * Extends ListQueryDto for common pagination and sorting fields
 *
 * Filter fields:
 * - questionId (filter by specific question)
 * - search (search by title) — inherited from ListQueryDto
 */
export class QuestionChatListQueryDto extends ListQueryDto {
  /**
   * Filter by question ID
   * @optional
   */
  @IsOptionalIdNumber('ID câu hỏi')
  questionId?: number

  /**
   * Chuyển đổi thành filter options cho repository
   */
  toFilterOptions(): QuestionChatFilterOptions {
    return {
      search: this.search,
      questionId: this.questionId,
    }
  }

  /**
   * Chuyển đổi thành pagination options cho repository
   */
  toPaginationOptions(): QuestionChatPaginationOptions {
    return {
      page: this.page || 1,
      limit: this.limit || 10,
      sortBy: this.sortBy || 'updatedAt',
      sortOrder: this.sortOrder || SortOrder.DESC,
    }
  }
}
