import { Injectable } from '@nestjs/common'
import { OpenAIService } from './openai.service'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

export interface DocumentSeoFields {
  targetKeyword: string
  keywordText: string
  metaTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  searchIntent: string
}

@Injectable()
export class DocumentSeoAiService {
  constructor(private readonly openaiService: OpenAIService) {}

  async generate(params: { title: string; content?: string | null }): Promise<DocumentSeoFields> {
    const normalizedContent = TextSearchUtil.stripMarkdownForSearch(params.content || '').slice(0, 12000)

    const systemMessage = [
      'Bạn là chuyên gia SEO tiếng Việt cho website giáo dục.',
      'Hãy tạo metadata giúp trang có cơ hội hiển thị tốt trên Google khi người dùng tìm đúng chủ đề.',
      'Bắt buộc viết tiếng Việt có dấu, tự nhiên, không nhồi nhét từ khóa, không dùng clickbait.',
      'Ưu tiên từ khóa sát ý định tìm kiếm, tiêu đề rõ ràng, mô tả hữu ích và có thể xuất hiện trên kết quả tìm kiếm.',
      'Chỉ trả về JSON hợp lệ, không markdown, không giải thích.',
    ].join('\n')

    const prompt = [
      'Tạo metadata SEO cho tài liệu sau.',
      `Tiêu đề: ${params.title}`,
      `Nội dung: ${normalizedContent || '(không có nội dung)'}`,
      '',
      'Trả về đúng object JSON với các field:',
      '- targetKeyword: 1 cụm từ khóa chính tiếng Việt có dấu',
      '- keywordText: 5-10 cụm từ khóa phụ, ngăn cách bằng dấu phẩy',
      '- metaTitle: tối đa 60 ký tự, có từ khóa chính',
      '- metaDescription: khoảng 140-160 ký tự, rõ lợi ích và có từ khóa chính',
      '- ogTitle: tiêu đề chia sẻ mạng xã hội, tự nhiên',
      '- ogDescription: mô tả chia sẻ mạng xã hội, tự nhiên',
      '- searchIntent: một trong informational, practice, download, exam prep',
    ].join('\n')

    const raw = await this.openaiService.generateText(prompt, systemMessage, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 700,
    })

    return this.parse(raw)
  }

  private parse(raw: string): DocumentSeoFields {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      targetKeyword: String(parsed.targetKeyword || '').trim(),
      keywordText: String(parsed.keywordText || '').trim(),
      metaTitle: String(parsed.metaTitle || '').trim(),
      metaDescription: String(parsed.metaDescription || '').trim(),
      ogTitle: String(parsed.ogTitle || '').trim(),
      ogDescription: String(parsed.ogDescription || '').trim(),
      searchIntent: String(parsed.searchIntent || '').trim(),
    }
  }
}
