import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common'
import {
  CreateChapterDto,
  UpdateChapterDto,
  ChapterResponseDto,
  ChapterDetailResponseDto,
  BaseResponseDto,
  ChapterListQueryDto,
  PaginationResponseDto,
} from '../../application/dtos'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import {
  CreateChapterUseCase,
  GetChapterUseCase,
  GetAllChaptersUseCase,
  GetChapterChildrenUseCase,
  GetRootChaptersUseCase,
  UpdateChapterUseCase,
  DeleteChapterUseCase,
} from '../../application/use-cases/chapter'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'

@Controller('chapters')
export class ChapterController {
  constructor(
    private readonly createChapterUseCase: CreateChapterUseCase,
    private readonly getChapterUseCase: GetChapterUseCase,
    private readonly getAllChaptersUseCase: GetAllChaptersUseCase,
    private readonly getChapterChildrenUseCase: GetChapterChildrenUseCase,
    private readonly getRootChaptersUseCase: GetRootChaptersUseCase,
    private readonly updateChapterUseCase: UpdateChapterUseCase,
    private readonly deleteChapterUseCase: DeleteChapterUseCase,
  ) {}

  /**
   * Create a new chapter
   * POST /chapters
   */
  @Post()
  @RequirePermission('chapter.create')
  @HttpCode(HttpStatus.CREATED)
  async createChapter(
    @Body() dto: CreateChapterDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ChapterResponseDto>> {
    return ExceptionHandler.execute(() => this.createChapterUseCase.execute(dto, adminId))
  }

  /**
   * Get all chapters with pagination and filtering
   * GET /chapters
   * Query params:
   * - page: số trang (mặc định: 1)
   * - limit: số lượng mỗi trang (mặc định: 10, max: 100)
   * - search: tìm kiếm theo name, slug, code
   * - subjectId: filter theo môn học
   * - parentChapterId: filter theo chương cha
   * - level: filter theo cấp độ
   * - sortBy: trường sắp xếp (name, slug, orderInParent, level)
   * - sortOrder: thứ tự sắp xếp (asc, desc)
   * Note: For tree lazy loading, use /chapters/root and /chapters/:id/children instead
   */
  @Get()
  @RequirePermission('chapter.getAll')
  @HttpCode(HttpStatus.OK)
  async getAllChapters(
    @Query() query: ChapterListQueryDto,
  ): Promise<PaginationResponseDto<ChapterResponseDto>> {
    return ExceptionHandler.execute(() => this.getAllChaptersUseCase.execute(query))
  }

  /**
   * Get root chapters (chapters without parent) - For tree lazy loading
   * GET /chapters/root
   * Query params:
   * - subjectId: filter theo môn học (optional)
   * - page: số trang (mặc định: 1)
   * - limit: số lượng mỗi trang (mặc định: 100)
   */
  @Get('root')
  @RequirePermission('chapter.getAll')
  @HttpCode(HttpStatus.OK)
  async getRootChapters(
    @Query('subjectId', new ParseIntPipe({ optional: true })) subjectId?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 100,
  ): Promise<PaginationResponseDto<ChapterResponseDto>> {
    return ExceptionHandler.execute(() => this.getRootChaptersUseCase.execute(subjectId, page, limit))
  }

  /**
   * Get chapter by ID
   * GET /chapters/:id
   */
  @Get(':id')
  @RequirePermission('chapter.getById')
  @HttpCode(HttpStatus.OK)
  async getChapter(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<ChapterDetailResponseDto>> {
    return ExceptionHandler.execute(() => this.getChapterUseCase.execute(id))
  }

  /**
   * Get children of a chapter - For tree lazy loading
   * GET /chapters/:id/children
   * Query params:
   * - page: số trang (mặc định: 1)
   * - limit: số lượng mỗi trang (mặc định: 100)
   */
  @Get(':id/children')
  @RequirePermission('chapter.getAll')
  @HttpCode(HttpStatus.OK)
  async getChapterChildren(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 100,
  ): Promise<PaginationResponseDto<ChapterResponseDto>> {
    return ExceptionHandler.execute(() => this.getChapterChildrenUseCase.execute(id, page, limit))
  }

  /**
   * Update chapter
   * PUT /chapters/:id
   */
  @Put(':id')
  @RequirePermission('chapter.update')
  @HttpCode(HttpStatus.OK)
  async updateChapter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChapterDto,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<ChapterResponseDto>> {
    return ExceptionHandler.execute(() => this.updateChapterUseCase.execute(id, dto, adminId))
  }

  /**
   * Delete chapter
   * DELETE /chapters/:id
   */
  @Delete(':id')
  @RequirePermission('chapter.delete')
  @HttpCode(HttpStatus.OK)
  async deleteChapter(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('adminId') adminId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean }>> {
    return ExceptionHandler.execute(() => this.deleteChapterUseCase.execute(id, adminId))
  }
}
