import type { MarkdownRenderService as MarkdownRenderServicePort } from 'src/application/interfaces/markdown-render.interface'
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

        const normalizedContent = this.normalizeMathDelimiters(content)

        const md = new MarkdownIt({
            html: options?.allowRawHtml ?? true,
            linkify: true,
            breaks: options?.breaks ?? true,
            typographer: false,
        })

        md.renderer.rules.image = (tokens, idx, rendererOptions, env, self) => {
            const token = tokens[idx]
            const src = token.attrGet('src') || ''
            const alt = token.content.trim()

            token.attrSet('alt', alt)
            token.attrSet(
                'style',
                [
                    'display:block',
                    'margin:0 auto',
                    'max-width:100%',
                    'max-height:clamp(260px,60vh,560px)',
                    'width:auto',
                    'height:auto',
                    'object-fit:contain',
                ].join(';'),
            )

            const imageHtml = self.renderToken(tokens, idx, rendererOptions)
            const safeHref = md.utils.escapeHtml(src)
            const safeCaption = md.utils.escapeHtml(alt)
            const captionHtml = alt
                ? `<span style="display:block;margin-top:8px;text-align:center;"><em>${safeCaption}</em></span>`
                : ''

            return `
                <span style="display:block;margin:20px 0;">
                    <a
                        href="${safeHref}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="display:flex;justify-content:center;align-items:center;width:100%;max-width:100%;"
                    >
                        ${imageHtml}
                    </a>
                    ${captionHtml}
                </span>
            `
        }

        // Render inline ($...$) and block ($$...$$) math using KaTeX.
        md.use(texmath as any, {
            engine: katex,
            delimiters: 'dollars',
            katexOptions: {
                strict: false,
                throwOnError: false,
            },
        } as any)

        return md.render(normalizedContent)
    }

    private normalizeMathDelimiters(content: string): string {
        // markdown-it-texmath with dollar delimiters does not parse "$ ... $" reliably.
        // Normalize to "$...$" and "$$...$$" before rendering.
        return content
            .replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_match, expr: string) => `$$${expr}$$`)
            .replace(/\$\s*([^$\n]+?)\s*\$/g, (_match, expr: string) => `$${expr}$`)
    }
}
