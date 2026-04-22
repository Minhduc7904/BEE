// src/application/dtos/question-chat-message/question-chat-message.dto.ts

import {
  IsRequiredIdNumber,
  IsRequiredString,
  IsRequiredEnumValue,
} from 'src/shared/decorators/validate'
import { IsOptional } from 'class-validator'
import { QuestionChatRole } from '../../../shared/enums'

/**
 * DTO for creating a new chat message
 *
 * Required fields:
 * - chatId (ID cuộc hội thoại)
 * - role (Vai trò: USER | AI)
 * - content (Nội dung tin nhắn)
 *
 * Optional fields:
 * - metadata (Dữ liệu bổ sung, ví dụ: tokenUsage, model, ...)
 */
export class CreateQuestionChatMessageDto {
  /**
   * Chat ID that this message belongs to
   * @required
   */
  @IsRequiredIdNumber('ID cuộc hội thoại')
  chatId: number

  /**
   * Role of the message sender (USER or AI)
   * @required
   */
  @IsRequiredEnumValue(QuestionChatRole, 'Vai trò')
  role: QuestionChatRole

  /**
   * Message content
   * @required
   * @maxLength 10000
   */
  @IsRequiredString('Nội dung tin nhắn', 10000)
  content: string

  /**
   * Additional metadata (e.g., tokenUsage, model, processingTime)
   * @optional
   */
  @IsOptional()
  metadata?: Record<string, any> | null
}
