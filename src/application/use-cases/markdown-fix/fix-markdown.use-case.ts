import { Injectable } from '@nestjs/common'
import { MarkdownFixService } from '../../../infrastructure/services/markdown-fix.service'
import { FixMarkdownRequestDto } from '../../dtos/markdown-fix/fix-markdown-request.dto'
import { FixMarkdownResponseDto } from '../../dtos/markdown-fix/fix-markdown-response.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

/**
 * Use case: Sửa chính tả và ngữ pháp cho đoạn Markdown
 * Bảo toàn ký hiệu toán học, media placeholder, và cấu trúc Markdown
 *
 * Xử lý media presigned URL:
 * - Trước khi gửi AI: thay ![media:ID](presignedUrl) → ![media:ID](media:ID)
 *   để AI không chỉnh sửa URL và không làm tăng token không cần thiết
 * - Sau khi AI trả về: khôi phục lại URL gốc
 */
@Injectable()
export class FixMarkdownUseCase {
    constructor(
        private readonly markdownFixService: MarkdownFixService,
    ) { }

    /**
     * Tách presigned URL khỏi các media placeholder.
     *
     * Pattern: ![media:ID](anyUrl)  hoặc  ![image:ID](anyUrl)
     * → lưu map ID → originalUrl
     * → thay thế bằng ![media:ID](media:ID)
     *
     * Lưu ý: dùng `[^)]*` để bắt toàn bộ URL (kể cả URL có ký tự đặc biệt như &, =, %)
     */
    private stripMediaUrls(content: string): {
        stripped: string
        urlMap: Map<string, string>
    } {
        // Match: ![media:ID](url) hoặc ![image:ID](url), ID là chuỗi không chứa ]
        const MEDIA_PATTERN = /!\[(media|image):([^\]]+)\]\(([^)]+)\)/g
        const urlMap = new Map<string, string>()

        const stripped = content.replace(MEDIA_PATTERN, (_match, prefix, id, url) => {
            const key = `${prefix}:${id}`
            // Chỉ lưu nếu URL không phải dạng rút gọn (tránh map chính nó)
            const shortUrl = `${prefix}:${id}`
            if (url !== shortUrl) {
                urlMap.set(key, url)
            }
            return `![${key}](${shortUrl})`
        })

        return { stripped, urlMap }
    }

    /**
     * Khôi phục presigned URL vào các media placeholder sau khi AI xử lý.
     */
    private restoreMediaUrls(content: string, urlMap: Map<string, string>): string {
        if (urlMap.size === 0) return content

        // Thay ![media:ID](media:ID) hoặc ![image:ID](image:ID) → ![media:ID](originalUrl)
        const MEDIA_PLACEHOLDER = /!\[((?:media|image):[^\]]+)\]\(((?:media|image):[^)]+)\)/g

        return content.replace(MEDIA_PLACEHOLDER, (_match, altKey, _urlKey) => {
            const originalUrl = urlMap.get(altKey)
            return originalUrl ? `![${altKey}](${originalUrl})` : _match
        })
    }

    async execute(dto: FixMarkdownRequestDto): Promise<BaseResponseDto<FixMarkdownResponseDto>> {
        const startTime = Date.now()

        // 1. Tách presigned URL ra, thay bằng placeholder rút gọn
        const { stripped, urlMap } = this.stripMediaUrls(dto.content)

        // 2. Gửi nội dung đã rút gọn cho AI xử lý
        const result = await this.markdownFixService.fixMarkdown(stripped)

        // 3. Khôi phục presigned URL vào kết quả AI trả về
        const fixedContent = this.restoreMediaUrls(result.fixedContent, urlMap)

        const response: FixMarkdownResponseDto = {
            fixedContent,
            processingTimeMs: Date.now() - startTime,
            usage: result.usage,
        }

        return BaseResponseDto.success('Sửa chính tả Markdown thành công', response)
    }
}

