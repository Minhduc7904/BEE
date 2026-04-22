// src/domain/repositories/question-chat.repository.ts

import { QuestionChat } from '../entities/question-chat/question-chat.entity'
import { SortOrder } from 'src/shared/enums/sort-order.enum'

export interface CreateQuestionChatData {
    userId: number
    questionId: number
    title?: string | null
}

export interface QuestionChatFilterOptions {
    userId?: number
    questionId?: number
    search?: string // search theo title
}

export interface QuestionChatPaginationOptions {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: SortOrder
}

export interface QuestionChatListResult {
    chats: QuestionChat[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface IQuestionChatRepository {
    create(data: CreateQuestionChatData, txClient?: any): Promise<QuestionChat>

    findById(chatId: number, txClient?: any): Promise<QuestionChat | null>

    findByUser(
        userId: number,
        pagination: QuestionChatPaginationOptions,
        filters?: QuestionChatFilterOptions,
        txClient?: any,
    ): Promise<QuestionChatListResult>

    update(
        chatId: number,
        data: Partial<CreateQuestionChatData>,
        txClient?: any,
    ): Promise<QuestionChat>

    delete(chatId: number, txClient?: any): Promise<void>

    // 🔥 thêm cái này rất useful
    findByQuestion(
        questionId: number,
        userId: number,
        txClient?: any,
    ): Promise<QuestionChat | null>
}