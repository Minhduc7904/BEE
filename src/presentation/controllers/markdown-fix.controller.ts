import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { FixMarkdownUseCase } from '../../application/use-cases/markdown-fix'
import { FixMarkdownRequestDto, FixMarkdownResponseDto } from '../../application/dtos/markdown-fix'
import { BaseResponseDto } from '../../application/dtos/common/base-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'

/**
 * Controller xử lý sửa chính tả Markdown
 *
 * POST /markdown/fix-spelling
 */
@Controller('markdown')
export class MarkdownFixController {
  constructor(private readonly fixMarkdownUseCase: FixMarkdownUseCase) {}

  /**
   * Sửa chính tả và ngữ pháp đoạn Markdown.
   *
   * ─── ĐẦU VÀO ────────────────────────────────────────────────────────────────
   * @body content  Đoạn văn bản Markdown cần sửa chính tả.
   *                Có thể chứa:
   *                - Ký hiệu toán học ($...$, $$...$$) – sẽ được bảo toàn
   *                - Media placeholder (![media:ID]) – sẽ được bảo toàn
   *                - Bảng Markdown, danh sách, tiêu đề – sẽ được bảo toàn
   *                Tối đa 50.000 ký tự.
   *
   * ─── ĐẦU RA ─────────────────────────────────────────────────────────────────
   * @returns FixMarkdownResponseDto
   *   - fixedContent      : Nội dung Markdown đã được sửa chính tả
   *   - processingTimeMs  : Thời gian xử lý (ms)
   *   - usage             : Thông tin token sử dụng (promptTokens, completionTokens, totalTokens)
   */
  @Post('fix-spelling')
  @RequirePermission(PERMISSION_CODES.EXAM_IMPORT_SESSION.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async fixSpelling(@Body() dto: FixMarkdownRequestDto): Promise<BaseResponseDto<FixMarkdownResponseDto>> {
    return ExceptionHandler.execute(() => this.fixMarkdownUseCase.execute(dto))
  }
}
