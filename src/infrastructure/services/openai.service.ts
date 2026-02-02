import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

/**
 * Các tuỳ chọn khi gọi Chat Completion
 */
export interface ChatCompletionOptions {
    /** Model GPT sử dụng (vd: gpt-4o-mini, gpt-4.1, ...) */
    model?: string

    /** Độ sáng tạo của model (0 = rất chính xác, 1 = sáng tạo cao) */
    temperature?: number

    /** Số token tối đa cho output */
    maxTokens?: number

    /** Có bật streaming hay không */
    stream?: boolean
}

/**
 * Định dạng một message trong hội thoại
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

/**
 * OpenAIService
 *
 * Service tích hợp OpenAI dùng cho các tính năng AI
 *
 * Chức năng chính:
 * - Gọi Chat Completion với các model GPT
 * - Cho phép cấu hình model, temperature, max tokens
 * - Hỗ trợ streaming response
 * - Logging và xử lý lỗi tập trung
 */
@Injectable()
export class OpenAIService {
    private readonly logger = new Logger(OpenAIService.name)

    /** Client OpenAI chính */
    private readonly openaiClient: OpenAI

    /** Model mặc định */
    private readonly defaultModel: string

    /** Temperature mặc định */
    private readonly defaultTemperature: number

    /** Max tokens mặc định */
    private readonly defaultMaxTokens: number

    constructor(private readonly configService: ConfigService) {
        // Lấy config openai từ @nestjs/config
        const openaiConfig = this.configService.get('openai')

        // Ưu tiên lấy apiKey từ config, fallback sang process.env
        const apiKey = openaiConfig?.apiKey || process.env.OPENAI_API_KEY

        // Nếu không có API key thì log cảnh báo (app vẫn chạy)
        if (!apiKey) {
            this.logger.warn(
                'Chưa cấu hình OpenAI API key. Các tính năng AI sẽ không hoạt động.',
            )
        }

        // Khởi tạo OpenAI client
        this.openaiClient = new OpenAI({
            apiKey: apiKey,
            organization: openaiConfig?.organization,
        })

        // Gán giá trị mặc định
        this.defaultModel = openaiConfig?.model || 'gpt-4o-mini'
        this.defaultTemperature = openaiConfig?.temperature || 0.7
        this.defaultMaxTokens = openaiConfig?.maxTokens || 1000

        this.logger.log(
            `Khởi tạo OpenAI client thành công với model mặc định: ${this.defaultModel}`,
        )
    }

    /**
     * Tạo một chat completion (không streaming)
     *
     * @param messages Danh sách message trong hội thoại
     * @param options Tuỳ chọn cho completion
     * @returns Kết quả completion từ OpenAI
     */
    async createChatCompletion(
        messages: ChatMessage[],
        options?: ChatCompletionOptions,
    ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
        try {
            const model = options?.model || this.defaultModel
            const temperature = options?.temperature ?? this.defaultTemperature
            const maxTokens = options?.maxTokens || this.defaultMaxTokens

            this.logger.log(`Đang tạo chat completion với model: ${model}`)

            const completion = await this.openaiClient.chat.completions.create({
                model,
                messages: messages as ChatCompletionMessageParam[],
                temperature,
                max_tokens: maxTokens,
                stream: false, // ⚠️ ép cứng
            })
            this.logger.log('Tạo chat completion thành công')
            return completion
        } catch (error) {
            this.logger.error(
                `Lỗi khi tạo chat completion: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    /**
     * Tạo chat completion dạng streaming
     *
     * @param messages Danh sách message trong hội thoại
     * @param options Tuỳ chọn cho completion
     * @returns Stream response từ OpenAI
     */
    async createStreamingChatCompletion(
        messages: ChatMessage[],
        options?: ChatCompletionOptions,
    ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
        try {
            const model = options?.model || this.defaultModel
            const temperature = options?.temperature ?? this.defaultTemperature
            const maxTokens = options?.maxTokens || this.defaultMaxTokens

            this.logger.log(`Đang tạo streaming chat completion với model: ${model}`)

            const stream = await this.openaiClient.chat.completions.create({
                model,
                messages: messages as ChatCompletionMessageParam[],
                temperature,
                max_tokens: maxTokens,
                stream: true,
            })

            this.logger.log('Tạo streaming chat completion thành công')
            return stream
        } catch (error) {
            this.logger.error(
                `Lỗi khi tạo streaming chat completion: ${error.message}`,
                error.stack,
            )
            throw error
        }
    }

    /**
     * Hàm helper đơn giản để sinh text
     *
     * @param prompt Nội dung user gửi lên
     * @param systemMessage Message hệ thống (tuỳ chọn)
     * @param options Tuỳ chọn completion
     * @returns Nội dung text trả về từ GPT
     */
    async generateText(
        prompt: string,
        systemMessage?: string,
        options?: ChatCompletionOptions,
    ): Promise<string> {
        const messages: ChatMessage[] = []

        if (systemMessage) {
            messages.push({ role: 'system', content: systemMessage })
        }

        messages.push({ role: 'user', content: prompt })

        const completion = await this.createChatCompletion(messages, options)

        return completion.choices[0]?.message?.content || ''
    }

    /**
     * Trả về instance OpenAI client
     * (dùng khi cần gọi API nâng cao hoặc custom)
     */
    getClient(): OpenAI {
        return this.openaiClient
    }

    /**
     * Lấy cấu hình mặc định của OpenAI
     */
    getConfig() {
        return {
            model: this.defaultModel,
            temperature: this.defaultTemperature,
            maxTokens: this.defaultMaxTokens,
        }
    }
}
