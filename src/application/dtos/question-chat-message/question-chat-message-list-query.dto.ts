// src/application/dtos/question-chat-message/question-chat-message-list-query.dto.ts

import { ListQueryDto } from '../pagination/list-query.dto'
import { IsOptionalEnumValue } from 'src/shared/decorators/validate'
import { QuestionChatRole } from '../../../shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import type {
  QuestionChatMessagePaginationOptions,
  QuestionChatMessageFilterOptions,
} from '../../../domain/repositories/question-chat-message.repository'

/**
 * DTO for querying question chat messages with filters and pagination
 * Extends ListQueryDto for common pagination fields
 *
 * Filter fields:
 * - role (filter by USER or AI messages)
 */
export class QuestionChatMessageListQueryDto extends ListQueryDto {
  /**
   * Filter by message role
   * @optional
   */
  @IsOptionalEnumValue(QuestionChatRole, 'Vai trò')
  role?: QuestionChatRole

  /**
   * Chuyển đổi thành filter options cho repository
   */
  toFilterOptions(chatId: number): QuestionChatMessageFilterOptions {
    return {
      chatId,
      role: this.role,
    }
  }

  /**
   * Chuyển đổi thành pagination options cho repository
   */
  toPaginationOptions(): QuestionChatMessagePaginationOptions {
    return {
      page: this.page || 1,
      limit: this.limit || 20,
      sortOrder: this.sortOrder || SortOrder.ASC,
    }
  }
}
