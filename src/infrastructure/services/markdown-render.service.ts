import { Injectable, Logger } from '@nestjs/common'
import MarkdownIt from 'markdown-it'
import texmath from 'markdown-it-texmath'
import katex from 'katex'

export interface MarkdownRenderOptions {
    allowRawHtml?: boolean
    breaks?: boolean
}

@Injectable()
export class MarkdownRenderService {
    private readonly logger = new Logger(MarkdownRenderService.name)

    renderToHtml(content: string, options?: MarkdownRenderOptions): string {
        if (!content || content.trim().length === 0) {
            return ''
        }

        const md = new MarkdownIt({
            html: options?.allowRawHtml ?? true,
            linkify: true,
            breaks: options?.breaks ?? true,
            typographer: false,
        })

        // Render inline ($...$) and block ($$...$$) math using KaTeX.
        md.use(texmath as any, {
            engine: katex,
            delimiters: 'dollars',
            katexOptions: {
                strict: false,
                throwOnError: false,
            },
        } as any)

        return md.render(content)
    }
}
