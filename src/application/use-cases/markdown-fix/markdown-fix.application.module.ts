import { Module } from '@nestjs/common'
import { InfrastructureModule } from 'src/infrastructure/infrastructure.module'
import { FixMarkdownUseCase } from './'
import { RenderMarkdownUseCase } from './render-markdown.use-case'

const MARKDOWN_FIX_USE_CASES = [FixMarkdownUseCase, RenderMarkdownUseCase]

@Module({
  imports: [
    InfrastructureModule, // 🔥 BẮT BUỘC để inject MarkdownFixService
  ],
  providers: MARKDOWN_FIX_USE_CASES,
  exports: MARKDOWN_FIX_USE_CASES,
})
export class MarkdownFixApplicationModule {}
