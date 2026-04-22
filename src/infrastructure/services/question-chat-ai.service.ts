// src/infrastructure/services/question-chat-ai.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { OpenAIService, ChatMessage } from './openai.service'
import { Question } from '../../domain/entities/exam/question.entity'
import { QuestionChatMessage } from '../../domain/entities/question-chat/question-chat-message.entity'
import OpenAI from 'openai'

/**
 * Cấu trúc context câu hỏi để truyền cho AI
 */
export interface QuestionContext {
    questionId: number
    content: string
    type: string
    difficulty: string | null
    correctAnswer: string | null
    solution: string | null
    statements: Array<{
        order: number | null
        content: string
        isCorrect: boolean
    }>
    imageUrls: string[]
}

/**
 * QuestionChatAIService
 *
 * Service xử lý logic AI cho tính năng chat hỏi đáp về câu hỏi.
 *
 * Luồng xử lý:
 * 1. Nhận câu hỏi (Question entity) và tin nhắn của user
 * 2. Trích xuất context: nội dung câu hỏi, lời giải, đáp án, statements, ảnh
 * 3. Gửi toàn bộ context + lịch sử chat cho OpenAI
 * 4. Trả về câu trả lời AI
 */
@Injectable()
export class QuestionChatAIService {
    private readonly logger = new Logger(QuestionChatAIService.name)

    constructor(private readonly openaiService: OpenAIService) {}

    /**
     * Sinh câu trả lời AI dựa trên câu hỏi và tin nhắn user
     *
     * @param question Question entity (đã bao gồm statements)
     * @param userMessage Tin nhắn user gửi
     * @param chatHistory Lịch sử tin nhắn trước đó (tuỳ chọn)
     * @returns Nội dung câu trả lời AI
     */
    async generateAnswer(
        question: Question,
        userMessage: string,
        chatHistory: QuestionChatMessage[] = [],
    ): Promise<{ content: string; metadata: Record<string, any> }> {
        try {
            // 1. Xây dựng context từ question
            const context = this.buildQuestionContext(question)

            // 2. Xây dựng system message
            const systemMessage = this.buildSystemMessage(context)

            // 3. Xây dựng messages array (bao gồm cả ảnh nếu có)
            const messages = this.buildMessages(systemMessage, context, userMessage, chatHistory)

            this.logger.log(
                `Đang gọi AI cho câu hỏi #${question.questionId}, ` +
                `${context.imageUrls.length} ảnh, ${chatHistory.length} tin nhắn lịch sử`,
            )

            // 4. Gọi OpenAI API
            const client = this.openaiService.getClient()
            const config = this.openaiService.getConfig()

            const completion = await client.chat.completions.create({
                model: context.imageUrls.length > 0 ? 'gpt-4o' : (config.model || 'gpt-4o-mini'),
                messages,
                temperature: 0.3,
                max_tokens: 2000,
                stream: false,
            })

            const aiContent = completion.choices[0]?.message?.content || 'Xin lỗi, thầy không thể trả lời câu hỏi này.'

            const metadata = {
                model: completion.model,
                promptTokens: completion.usage?.prompt_tokens,
                completionTokens: completion.usage?.completion_tokens,
                totalTokens: completion.usage?.total_tokens,
                questionId: question.questionId,
                imageCount: context.imageUrls.length,
            }

            this.logger.log(
                `AI trả lời thành công cho câu hỏi #${question.questionId}, ` +
                `tokens: ${metadata.totalTokens}`,
            )

            return { content: aiContent, metadata }
        } catch (error: any) {
            this.logger.error(
                `Lỗi khi gọi AI cho câu hỏi #${question.questionId}: ${error?.message}`,
                error?.stack,
            )
            throw error
        }
    }

    /**
     * Xây dựng context từ Question entity
     */
    private buildQuestionContext(question: Question): QuestionContext {
        // Trích xuất ảnh từ nội dung câu hỏi và statements
        const imageUrls: string[] = []

        // Ảnh từ content câu hỏi
        imageUrls.push(...this.extractImageUrls(question.content))

        // Ảnh từ solution
        if (question.solution) {
            imageUrls.push(...this.extractImageUrls(question.solution))
        }

        // Ảnh từ statements
        const statements = (question.statements || []).map((s) => {
            imageUrls.push(...this.extractImageUrls(s.content))
            return {
                order: s.order ?? null,
                content: s.content,
                isCorrect: s.isCorrect,
            }
        })

        return {
            questionId: question.questionId,
            content: question.content,
            type: question.getTypeDisplay(),
            difficulty: question.getDifficultyDisplay(),
            correctAnswer: question.correctAnswer ?? null,
            solution: question.solution ?? null,
            statements,
            imageUrls: [...new Set(imageUrls)], // loại bỏ trùng lặp
        }
    }

    /**
     * Xây dựng system message cho AI
     */
    private buildSystemMessage(context: QuestionContext): string {
        const parts: string[] = []

        parts.push(`Bạn là thầy Bee – một giáo viên tận tâm, thông minh và kiên nhẫn. Nhiệm vụ: giúp học sinh hiểu và giải câu hỏi.`)
        parts.push('')
        parts.push('Quy tắc:')
        parts.push('- Xưng hô: "Thầy" - "con".')
        parts.push('- Giải thích rõ ràng, dễ hiểu, từng bước.')
        parts.push('- Nếu câu hỏi có hình ảnh, hãy mô tả và phân tích nội dung hình ảnh.')
        parts.push('- Sử dụng Markdown để format câu trả lời (bold, italic, danh sách, công thức LaTeX nếu cần).')
        parts.push('- Nếu là toán học, sử dụng ký hiệu LaTeX: $...$ cho inline và $$...$$ cho block.')
        parts.push('- Luôn kết thúc bằng lời động viên tích cực.')
        parts.push('- Nếu học sinh hỏi ngoài phạm vi câu hỏi, nhắc nhẹ nhàng quay lại chủ đề.')
        parts.push('')

        // Thông tin câu hỏi
        parts.push('=== THÔNG TIN CÂU HỎI ===')
        parts.push(`Loại: ${context.type}`)
        if (context.difficulty) {
            parts.push(`Độ khó: ${context.difficulty}`)
        }
        parts.push('')
        parts.push('Nội dung câu hỏi:')
        parts.push(context.content)
        parts.push('')

        // Statements (đáp án trắc nghiệm)
        if (context.statements.length > 0) {
            parts.push('Các đáp án:')
            context.statements.forEach((s, i) => {
                const label = String.fromCharCode(65 + i) // A, B, C, D...
                const correctMark = s.isCorrect ? ' ✅ (đúng)' : ''
                parts.push(`${label}. ${s.content}${correctMark}`)
            })
            parts.push('')
        }

        // Đáp án đúng
        if (context.correctAnswer) {
            parts.push(`Đáp án đúng: ${context.correctAnswer}`)
            parts.push('')
        }

        // Lời giải
        if (context.solution) {
            parts.push('Lời giải chi tiết:')
            parts.push(context.solution)
            parts.push('')
        }

        parts.push('=== KẾT THÚC THÔNG TIN CÂU HỎI ===')
        parts.push('')
        parts.push('Hãy dựa vào thông tin trên để trả lời câu hỏi của học sinh.')

        return parts.join('\n')
    }

    /**
     * Xây dựng messages array cho OpenAI API
     * Hỗ trợ cả text và image (vision)
     */
    private buildMessages(
        systemMessage: string,
        context: QuestionContext,
        userMessage: string,
        chatHistory: QuestionChatMessage[],
    ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

        // System message
        messages.push({ role: 'system', content: systemMessage })

        // Nếu có ảnh, gửi kèm trong message đầu tiên (vision)
        if (context.imageUrls.length > 0) {
            const imageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
                {
                    type: 'text',
                    text: 'Dưới đây là các hình ảnh liên quan đến câu hỏi:',
                },
                ...context.imageUrls.map((url) => ({
                    type: 'image_url' as const,
                    image_url: { url, detail: 'high' as const },
                })),
            ]

            messages.push({ role: 'user', content: imageContent })
            messages.push({
                role: 'assistant',
                content: 'Thầy đã xem các hình ảnh liên quan đến câu hỏi. Con hãy hỏi thầy nhé!',
            })
        }

        // Chat history (giới hạn 20 tin nhắn gần nhất để tránh vượt token limit)
        const recentHistory = chatHistory.slice(-20)
        for (const msg of recentHistory) {
            messages.push({
                role: msg.isUserMessage() ? 'user' : 'assistant',
                content: msg.content,
            })
        }

        // Tin nhắn hiện tại của user
        messages.push({ role: 'user', content: userMessage })

        return messages
    }

    /**
     * Trích xuất URLs ảnh từ nội dung Markdown
     *
     * Hỗ trợ cả:
     * - Markdown: ![alt](url)
     * - HTML: <img src="url">
     * - URL trực tiếp của ảnh
     */
    private extractImageUrls(content: string): string[] {
        if (!content) return []

        const urls: string[] = []

        // Match Markdown images: ![alt](url)
        const mdRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g
        let match: RegExpExecArray | null
        while ((match = mdRegex.exec(content)) !== null) {
            urls.push(match[1])
        }

        // Match HTML images: <img src="url">
        const htmlRegex = /<img[^>]+src=["'](https?:\/\/[^\s"']+)["'][^>]*>/gi
        while ((match = htmlRegex.exec(content)) !== null) {
            urls.push(match[1])
        }

        return urls
    }
}
