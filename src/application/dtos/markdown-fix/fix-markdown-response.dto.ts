export class FixMarkdownResponseDto {
    /** Nội dung Markdown đã được sửa chính tả */
    fixedContent: string

    /** Thời gian xử lý (ms) */
    processingTimeMs: number

    /** Thông tin token sử dụng (nếu có) */
    usage?: {
        promptTokens: number
        completionTokens: number
        totalTokens: number
    }
}
