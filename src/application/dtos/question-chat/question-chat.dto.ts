// src/application/dtos/question-chat/question-chat.dto.ts

import { QuestionChat } from '../../../domain/entities/question-chat/question-chat.entity'
import { QuestionChatMessage } from '../../../domain/entities/question-chat/question-chat-message.entity'
import {
  IsRequiredIdNumber,
  IsOptionalString,
} from 'src/shared/decorators/validate'
import { PaginationResponseDto, PaginationMetaDto } from '../pagination/pagination-response.dto'

/**
 * DTO for creating a new question chat
 *
 * Required fields:
 * - questionId (ID câu hỏi)
 *
 * Optional fields:
 * - title (Tiêu đề cuộc hội thoại)
 *
 * Note: userId is injected from the authenticated user, not from the request body.
 */
export class CreateQuestionChatDto {
  /**
   * Question ID that this chat is about
   * @required
   */
  @IsRequiredIdNumber('ID câu hỏi')
  questionId: number

  /**
   * Chat title (optional, can be auto-generated or set later)
   * @optional
   * @maxLength 255
   */
  @IsOptionalString('Tiêu đề', 255)
  title?: string
}

/**
 * DTO for updating an existing question chat
 * Currently only supports renaming the chat title
 */
export class UpdateQuestionChatDto {
  /**
   * New title for the chat
   * @optional
   * @maxLength 255
   */
  @IsOptionalString('Tiêu đề', 255)
  title?: string
}

/**
 * Response DTO for question chat message data
 */
export class QuestionChatMessageResponseDto {
  messageId: number
  chatId: number
  role: string
  content: string
  /** HTML đã render từ markdown (chỉ có khi role = AI) */
  contentHtml?: string | null
  metadata?: Record<string, any> | null
  createdAt: Date

  static fromMessage(message: QuestionChatMessage): QuestionChatMessageResponseDto {
    return {
      messageId: message.messageId,
      chatId: message.chatId,
      role: message.role,
      content: message.content,
      contentHtml: null,
      metadata: message.metadata,
      createdAt: message.createdAt,
    }
  }

  static fromMessageList(messages: QuestionChatMessage[]): QuestionChatMessageResponseDto[] {
    return messages.map((msg) => this.fromMessage(msg))
  }
}

/**
 * Response DTO for question chat data
 */
export class QuestionChatResponseDto {
  chatId: number
  userId: number
  questionId: number
  title?: string | null
  createdAt: Date
  updatedAt: Date
  messages?: QuestionChatMessageResponseDto[]
  lastMessage?: QuestionChatMessageResponseDto | null

  static fromChat(chat: QuestionChat): QuestionChatResponseDto {
    return {
      chatId: chat.chatId,
      userId: chat.userId,
      questionId: chat.questionId,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }
  }

  static fromChatWithMessages(chat: QuestionChat): QuestionChatResponseDto {
    return {
      ...this.fromChat(chat),
      messages: chat.messages?.map((m) => QuestionChatMessageResponseDto.fromMessage(m)) || [],
    }
  }

  static fromChatWithLastMessage(chat: QuestionChat): QuestionChatResponseDto {
    const lastMessage = chat.getLastMessage()
    return {
      ...this.fromChat(chat),
      lastMessage: lastMessage ? QuestionChatMessageResponseDto.fromMessage(lastMessage) : null,
    }
  }

  static fromChatList(chats: QuestionChat[]): QuestionChatResponseDto[] {
    return chats.map((chat) => this.fromChatWithLastMessage(chat))
  }
}

/**
 * Paginated list response DTO for question chats
 * Follows QuestionListResponseDto pattern
 */
export class QuestionChatListResponseDto extends PaginationResponseDto<QuestionChatResponseDto> {
  constructor(data: QuestionChatResponseDto[], page: number, limit: number, total: number) {
    const meta = new PaginationMetaDto(page, limit, total)
    super(true, 'Lấy danh sách cuộc hội thoại thành công', data, meta)
  }

  static fromChats(
    chats: QuestionChat[],
    page: number,
    limit: number,
    total: number,
  ): QuestionChatListResponseDto {
    const data = QuestionChatResponseDto.fromChatList(chats)
    return new QuestionChatListResponseDto(data, page, limit, total)
  }
}

/**
 * Paginated list response DTO for question chat messages
 * Follows QuestionListResponseDto pattern
 */
export class QuestionChatMessageListResponseDto extends PaginationResponseDto<QuestionChatMessageResponseDto> {
  constructor(data: QuestionChatMessageResponseDto[], page: number, limit: number, total: number) {
    const meta = new PaginationMetaDto(page, limit, total)
    super(true, 'Lấy danh sách tin nhắn thành công', data, meta)
  }

  static fromMessages(
    messages: QuestionChatMessage[],
    page: number,
    limit: number,
    total: number,
  ): QuestionChatMessageListResponseDto {
    const data = QuestionChatMessageResponseDto.fromMessageList(messages)
    return new QuestionChatMessageListResponseDto(data, page, limit, total)
  }
}
