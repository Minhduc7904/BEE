// src/infrastructure/repositories/question-chat/prisma-question-chat-message.repository.ts

import { Injectable } from '@nestjs/common'
import { QuestionChatMessage } from '../../../domain/entities/question-chat/question-chat-message.entity'
import {
    IQuestionChatMessageRepository,
    CreateQuestionChatMessageData,
    QuestionChatMessageFilterOptions,
    QuestionChatMessagePaginationOptions,
    QuestionChatMessageListResult,
} from '../../../domain/repositories/question-chat-message.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionChatMessageMapper } from '../../mappers/question-chat/question-chat-message.mapper'

@Injectable()
export class PrismaQuestionChatMessageRepository implements IQuestionChatMessageRepository {
    constructor(private readonly prisma: PrismaService | any) {}

    async create(
        data: CreateQuestionChatMessageData,
        txClient?: any,
    ): Promise<QuestionChatMessage> {
        const client = txClient || this.prisma

        const created = await client.questionChatMessage.create({
            data: {
                chatId: data.chatId,
                role: data.role,
                content: data.content,
                metadata: data.metadata ?? null,
            },
        })

        return QuestionChatMessageMapper.toDomainMessage(created)!
    }

    async findById(
        messageId: number,
        txClient?: any,
    ): Promise<QuestionChatMessage | null> {
        const client = txClient || this.prisma

        const msg = await client.questionChatMessage.findUnique({
            where: { messageId },
        })

        if (!msg) return null

        return QuestionChatMessageMapper.toDomainMessage(msg)
    }

    async findByChatId(
        chatId: number,
        pagination: QuestionChatMessagePaginationOptions,
        filters?: QuestionChatMessageFilterOptions,
        txClient?: any,
    ): Promise<QuestionChatMessageListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 20
        const skip = (page - 1) * limit

        const where: any = {
            chatId,
        }

        if (filters?.role) {
            where.role = filters.role
        }

        const [messages, total] = await Promise.all([
            client.questionChatMessage.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: pagination.sortOrder || 'asc',
                },
            }),
            client.questionChatMessage.count({ where }),
        ])

        return {
            messages: QuestionChatMessageMapper.toDomainMessages(messages),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async delete(messageId: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.questionChatMessage.delete({
            where: { messageId },
        })
    }

    async deleteByChatId(chatId: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.questionChatMessage.deleteMany({
            where: { chatId },
        })
    }
}