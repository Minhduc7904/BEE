import { QuestionChat } from './question-chat.entity'
import { QuestionChatRole } from 'src/shared/enums'

export class QuestionChatMessage {
    // Required
    messageId: number
    chatId: number
    role: QuestionChatRole
    content: string
    createdAt: Date

    // Optional
    metadata?: Record<string, any> | null

    // Navigation
    chat?: QuestionChat | null

    constructor(data: {
        messageId: number
        chatId: number
        role: QuestionChatRole
        content: string
        createdAt?: Date
        metadata?: Record<string, any> | null
        chat?: QuestionChat | null
    }) {
        this.messageId = data.messageId
        this.chatId = data.chatId
        this.role = data.role
        this.content = data.content
        this.createdAt = data.createdAt || new Date()

        this.metadata = data.metadata
        this.chat = data.chat
    }

    /* ===================== DOMAIN METHODS ===================== */

    isValid(): boolean {
        return (
            this.messageId > 0 &&
            this.chatId > 0 &&
            this.content.trim().length > 0
        )
    }

    isUserMessage(): boolean {
        return this.role === QuestionChatRole.USER
    }

    isAIMessage(): boolean {
        return this.role === QuestionChatRole.AI
    }

    hasMetadata(): boolean {
        return !!this.metadata
    }

    getTokenUsage(): number | null {
        return this.metadata?.tokenUsage ?? null
    }

    getModel(): string | null {
        return this.metadata?.model ?? null
    }

    isLongMessage(threshold: number = 500): boolean {
        return this.content.length > threshold
    }

    getPreview(maxLength: number = 100): string {
        if (this.content.length <= maxLength) return this.content
        return this.content.slice(0, maxLength) + '...'
    }

    belongsToChat(chatId: number): boolean {
        return this.chatId === chatId
    }

    equals(other: QuestionChatMessage): boolean {
        return this.messageId === other.messageId
    }

    toJSON() {
        return {
            messageId: this.messageId,
            chatId: this.chatId,
            role: this.role,
            content: this.content,
            metadata: this.metadata,
            createdAt: this.createdAt,
        }
    }

    clone(): QuestionChatMessage {
        return new QuestionChatMessage({
            messageId: this.messageId,
            chatId: this.chatId,
            role: this.role,
            content: this.content,
            metadata: this.metadata,
            createdAt: this.createdAt,
            chat: this.chat ? this.chat.clone() : null,
        })
    }
}