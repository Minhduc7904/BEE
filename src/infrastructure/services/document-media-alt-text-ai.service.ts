import { Injectable, Logger } from '@nestjs/common'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'
import { OpenAIService } from './openai.service'

export interface DocumentContentImageAltInput {
  mediaId: number
  currentAlt?: string
}

export interface DocumentMediaAltTextResult {
  thumbnailAlt?: string
  contentImageAlts: Map<number, string>
}

@Injectable()
export class DocumentMediaAltTextAiService {
  private readonly logger = new Logger(DocumentMediaAltTextAiService.name)

  constructor(private readonly openaiService: OpenAIService) {}

  async generate(params: {
    title: string
    content?: string | null
    includeThumbnail?: boolean
    contentImages?: DocumentContentImageAltInput[]
  }): Promise<DocumentMediaAltTextResult> {
    const contentImages = params.contentImages ?? []
    if (!params.includeThumbnail && contentImages.length === 0) {
      return { contentImageAlts: new Map() }
    }

    try {
      const contentOverview = TextSearchUtil.stripMarkdownForSearch(params.content || '').slice(0, 6000)
      const imageContexts = contentImages.map((image, index) => ({
        mediaId: image.mediaId,
        order: index + 1,
        currentAltHint: image.currentAlt || null,
        context: this.extractImageContext(params.content || '', image.mediaId),
      }))

      const systemMessage = [
        'Ban la chuyen gia viet alt text tieng Viet cho anh trong tai lieu giao duc.',
        'Muc tieu la viet alt text dung ngu canh, huu ich cho nguoi dung va cong cu tim kiem.',
        'Chi mo ta dieu co the suy ra chac chan tu tieu de va ngu canh noi dung, khong bia them chi tiet thi giac.',
        'Viet tieng Viet co dau, tu nhien, ngan gon, uu tien 8-18 tu, toi da 125 ky tu.',
        'Khong nhoi nhet tu khoa, khong bat dau bang "anh", "hinh anh", "thumbnail" neu khong can thiet.',
        'Chi tra ve JSON hop le, khong markdown, khong giai thich.',
      ].join('\n')

      const prompt = [
        'Hay tao alt text cho tai lieu sau.',
        `Tieu de tai lieu: ${params.title}`,
        `Tong quan noi dung: ${contentOverview || '(khong co noi dung)'}`,
        '',
        `Can tao alt cho thumbnail: ${params.includeThumbnail ? 'co' : 'khong'}`,
        'Quy tac thumbnail:',
        '- Neu can tao thumbnailAlt, hay mo ta anh dai dien cua tai lieu dua tren tieu de va chu de chinh.',
        '- Khong dung cac tu "thumbnail" hay "anh bia" neu khong thuc su can.',
        '',
        'Danh sach anh trong content:',
        JSON.stringify(imageContexts, null, 2),
        '',
        'Yeu cau output dung JSON schema sau:',
        '{',
        '  "thumbnailAlt": "string hoac null",',
        '  "contentImageAlts": [',
        '    { "mediaId": 123, "alt": "string" }',
        '  ]',
        '}',
        '',
        'Neu ngu canh cua mot anh chua du ro, hay dung currentAltHint neu co; neu van khong du, viet alt trung tinh dua tren chu de tai lieu va vi tri anh.',
      ].join('\n')

      const raw = await this.openaiService.generateText(prompt, systemMessage, {
        model: 'gpt-4o-mini',
        temperature: 0.2,
        maxTokens: 1200,
      })

      return this.parse(raw)
    } catch (error: any) {
      this.logger.warn(`Khong the tu dong tao alt text cho document: ${error.message}`)
      return { contentImageAlts: new Map() }
    }
  }

  private extractImageContext(content: string, mediaId: number): string {
    if (!content) return ''

    const marker = `![media:${mediaId}](media:${mediaId})`
    const index = content.indexOf(marker)
    if (index === -1) return ''

    const before = content.slice(Math.max(0, index - 220), index)
    const after = content.slice(index + marker.length, index + marker.length + 220)
    return TextSearchUtil.stripMarkdownForSearch(`${before} [IMAGE] ${after}`)
      .replace(/\s+/g, ' ')
      .trim()
  }

  private parse(raw: string): DocumentMediaAltTextResult {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    const contentImageAlts = new Map<number, string>()

    if (Array.isArray(parsed.contentImageAlts)) {
      parsed.contentImageAlts.forEach((item: any) => {
        const mediaId = Number(item?.mediaId)
        const alt = String(item?.alt || '').trim()
        if (Number.isInteger(mediaId) && mediaId > 0 && alt) {
          contentImageAlts.set(mediaId, alt.slice(0, 255))
        }
      })
    }

    const thumbnailAlt = String(parsed.thumbnailAlt || '').trim()
    return {
      thumbnailAlt: thumbnailAlt ? thumbnailAlt.slice(0, 255) : undefined,
      contentImageAlts,
    }
  }
}
