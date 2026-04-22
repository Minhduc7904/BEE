// src/infrastructure/mappers/question-chat/question-chat-message.mapper.ts

import { QuestionChatMessage } from '../../../domain/entities/question-chat/question-chat-message.entity'
import { QuestionChatRole } from 'src/shared/enums'
import { QuestionChatMapper } from './question-chat.mapper'

export class QuestionChatMessageMapper {
    /**
     * Convert Prisma → Domain
     */
    static toDomainMessage(prismaMessage: any): QuestionChatMessage | null {
        if (!prismaMessage) return null

        return new QuestionChatMessage({
            messageId: prismaMessage.messageId,
            chatId: prismaMessage.chatId,
            role: prismaMessage.role as QuestionChatRole,
            content: prismaMessage.content,
            createdAt: prismaMessage.createdAt,
            metadata: prismaMessage.metadata ?? null,

            // relation
            chat: prismaMessage.chat
                ? QuestionChatMapper.toDomainChat(prismaMessage.chat)
                : null,
        })
    }

    /**
     * Array Prisma → Domain
     */
    static toDomainMessages(prismaMessages: any[]): QuestionChatMessage[] {
        return prismaMessages
            .map((msg) => this.toDomainMessage(msg))
            .filter(Boolean) as QuestionChatMessage[]
    }
}