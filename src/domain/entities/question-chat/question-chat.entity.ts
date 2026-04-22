import { User } from '../user/user.entity'
import { Question } from '../exam/question.entity'
import { QuestionChatMessage } from './question-chat-message.entity'

export class QuestionChat {
    // Required
    chatId: number
    userId: number
    questionId: number
    createdAt: Date
    updatedAt: Date

    // Optional
    title?: string | null

    // Navigation
    user?: User
    question?: Question
    messages?: QuestionChatMessage[]

    constructor(data: {
        chatId: number
        userId: number
        questionId: number
        createdAt?: Date
        updatedAt?: Date
        title?: string | null
        user?: User | null
        question?: Question | null
        messages?: QuestionChatMessage[]
    }) {
        this.chatId = data.chatId
        this.userId = data.userId
        this.questionId = data.questionId
        this.createdAt = data.createdAt || new Date()
        this.updatedAt = data.updatedAt || new Date()

        this.title = data.title
        this.user = data.user || undefined
        this.question = data.question || undefined
        this.messages = data.messages
    }

    /* ===================== DOMAIN METHODS ===================== */

    isValid(): boolean {
        return this.chatId > 0 && this.userId > 0 && this.questionId > 0
    }

    hasTitle(): boolean {
        return Boolean(this.title && this.title.trim().length > 0)
    }

    setTitle(title: string): void {
        this.title = title?.trim() || null
        this.touch()
    }

    clearTitle(): void {
        this.title = null
        this.touch()
    }

    rename(title: string): void {
        this.setTitle(title)
    }

    addMessage(message: QuestionChatMessage): void {
        if (!this.messages) {
            this.messages = []
        }
        this.messages.push(message)
        this.touch()
    }

    getMessageCount(): number {
        return this.messages?.length || 0
    }

    hasMessages(): boolean {
        return this.getMessageCount() > 0
    }

    getLastMessage(): QuestionChatMessage | null {
        if (!this.messages || this.messages.length === 0) return null
        return this.messages[this.messages.length - 1]
    }

    belongsToUser(userId: number): boolean {
        return this.userId === userId
    }

    isForQuestion(questionId: number): boolean {
        return this.questionId === questionId
    }

    canAccess(userId: number): boolean {
        return this.belongsToUser(userId)
    }

    private touch(): void {
        this.updatedAt = new Date()
    }

    equals(other: QuestionChat): boolean {
        return this.chatId === other.chatId
    }

    toJSON() {
        return {
            chatId: this.chatId,
            userId: this.userId,
            questionId: this.questionId,
            title: this.title,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        }
    }

    clone(): QuestionChat {
        return new QuestionChat({
            chatId: this.chatId,
            userId: this.userId,
            questionId: this.questionId,
            title: this.title,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            user: this.user,
            question: this.question,
            messages: this.messages,
        })
    }
}