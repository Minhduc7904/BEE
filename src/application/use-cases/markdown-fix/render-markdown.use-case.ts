import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { RenderMarkdownRequestDto } from '../../dtos/markdown-fix/render-markdown-request.dto'
import { RenderMarkdownResponseDto } from '../../dtos/markdown-fix/render-markdown-response.dto'
import { MarkdownRenderService } from '../../../infrastructure/services/markdown-render.service'

@Injectable()
export class RenderMarkdownUseCase {
  constructor(private readonly markdownRenderService: MarkdownRenderService) {}

  async execute(dto: RenderMarkdownRequestDto): Promise<BaseResponseDto<RenderMarkdownResponseDto>> {
    const startTime = Date.now()

    const html = this.markdownRenderService.renderToHtml(dto.content, {
      allowRawHtml: dto.allowRawHtml,
      breaks: dto.breaks,
    })

    return BaseResponseDto.success('Render Markdown sang HTML thành công', {
      html,
      processingTimeMs: Date.now() - startTime,
    })
  }
}
