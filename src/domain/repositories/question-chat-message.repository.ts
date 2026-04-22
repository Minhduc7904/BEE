// src/domain/repositories/question-chat-message.repository.ts

import { QuestionChatMessage } from '../entities/question-chat/question-chat-message.entity'
import { QuestionChatRole } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface CreateQuestionChatMessageData {
    chatId: number
    role: QuestionChatRole
    content: string
    metadata?: Record<string, any> | null
}

export interface QuestionChatMessageFilterOptions {
    chatId: number
    role?: QuestionChatRole
}

export interface QuestionChatMessagePaginationOptions {
    page?: number
    limit?: number
    sortOrder?: SortOrder
}

export interface QuestionChatMessageListResult {
    messages: QuestionChatMessage[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface IQuestionChatMessageRepository {
    create(
        data: CreateQuestionChatMessageData,
        txClient?: any,
    ): Promise<QuestionChatMessage>

    createMany?(
        dataArray: CreateQuestionChatMessageData[],
        txClient?: any,
    ): Promise<number>

    findById(
        messageId: number,
        txClient?: any,
    ): Promise<QuestionChatMessage | null>

    findByChatId(
        chatId: number,
        pagination: QuestionChatMessagePaginationOptions,
        filters?: QuestionChatMessageFilterOptions,
        txClient?: any,
    ): Promise<QuestionChatMessageListResult>

    delete(messageId: number, txClient?: any): Promise<void>

    deleteByChatId(chatId: number, txClient?: any): Promise<void>
}