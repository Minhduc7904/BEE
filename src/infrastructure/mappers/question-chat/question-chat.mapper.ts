// src/infrastructure/mappers/question-chat/question-chat.mapper.ts

import { QuestionChat } from '../../../domain/entities/question-chat/question-chat.entity'
import { QuestionChatMessageMapper } from './question-chat-message.mapper'

// giả sử mày có sẵn mấy mapper này
import { UserMapper } from '../user/user.mapper'
import { QuestionMapper } from '../exam/question.mapper'

export class QuestionChatMapper {
    /**
     * Convert Prisma → Domain
     */
    static toDomainChat(prismaChat: any): QuestionChat | null {
        if (!prismaChat) return null

        return new QuestionChat({
            chatId: prismaChat.chatId,
            userId: prismaChat.userId,
            questionId: prismaChat.questionId,
            createdAt: prismaChat.createdAt,
            updatedAt: prismaChat.updatedAt ?? new Date(),
            title: prismaChat.title ?? null,

            // relations
            user: prismaChat.user
                ? UserMapper.toDomainUser(prismaChat.user)
                : undefined,

            question: prismaChat.question
                ? QuestionMapper.toDomainQuestion(prismaChat.question)
                : undefined,

            messages: prismaChat.messages
                ? QuestionChatMessageMapper.toDomainMessages(prismaChat.messages)
                : undefined,
        })
    }

    /**
     * Array Prisma → Domain
     */
    static toDomainChats(prismaChats: any[]): QuestionChat[] {
        return prismaChats
            .map((chat) => this.toDomainChat(chat))
            .filter(Boolean) as QuestionChat[]
    }
}