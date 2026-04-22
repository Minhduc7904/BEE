// src/infrastructure/repositories/question-chat/prisma-question-chat.repository.ts

import { Injectable } from '@nestjs/common'
import { QuestionChat } from '../../../domain/entities/question-chat/question-chat.entity'
import {
    IQuestionChatRepository,
    CreateQuestionChatData,
    QuestionChatFilterOptions,
    QuestionChatPaginationOptions,
    QuestionChatListResult,
} from '../../../domain/repositories/question-chat.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { QuestionChatMapper } from '../../mappers/question-chat/question-chat.mapper'

@Injectable()
export class PrismaQuestionChatRepository implements IQuestionChatRepository {
    constructor(private readonly prisma: PrismaService | any) { }

    async create(data: CreateQuestionChatData, txClient?: any): Promise<QuestionChat> {
        const client = txClient || this.prisma

        const created = await client.questionChat.create({
            data: {
                userId: data.userId,
                questionId: data.questionId,
                title: data.title ?? null,
            },
        })

        return QuestionChatMapper.toDomainChat(created)!
    }

    async findById(chatId: number, txClient?: any): Promise<QuestionChat | null> {
        const client = txClient || this.prisma

        const chat = await client.questionChat.findUnique({
            where: { chatId },
            include: {
                user: true,
                question: true,
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!chat) return null

        return QuestionChatMapper.toDomainChat(chat)
    }

    async findByUser(
        userId: number,
        pagination: QuestionChatPaginationOptions,
        filters?: QuestionChatFilterOptions,
        txClient?: any,
    ): Promise<QuestionChatListResult> {
        const client = txClient || this.prisma

        const page = pagination.page || 1
        const limit = pagination.limit || 10
        const skip = (page - 1) * limit

        const where: any = {
            userId,
        }

        if (filters?.questionId) {
            where.questionId = filters.questionId
        }

        if (filters?.search) {
            where.title = {
                contains: filters.search,
            }
        }

        const [chats, total] = await Promise.all([
            client.questionChat.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    updatedAt: 'desc',
                },
                include: {
                    // 🔥 chỉ lấy last message (optimize)
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            }),
            client.questionChat.count({ where }),
        ])

        return {
            chats: QuestionChatMapper.toDomainChats(chats),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    }

    async update(
        chatId: number,
        data: Partial<CreateQuestionChatData>,
        txClient?: any,
    ): Promise<QuestionChat> {
        const client = txClient || this.prisma

        const updated = await client.questionChat.update({
            where: { chatId },
            data: {
                title: data.title ?? undefined,
            },
        })

        return QuestionChatMapper.toDomainChat(updated)!
    }

    async delete(chatId: number, txClient?: any): Promise<void> {
        const client = txClient || this.prisma

        await client.questionChat.delete({
            where: { chatId },
        })
    }

    async findByQuestion(
        questionId: number,
        userId: number,
        txClient?: any,
    ): Promise<QuestionChat | null> {
        const client = txClient || this.prisma

        const chat = await client.questionChat.findFirst({
            where: {
                questionId,
                userId,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        })

        if (!chat) return null

        return QuestionChatMapper.toDomainChat(chat)
    }
}