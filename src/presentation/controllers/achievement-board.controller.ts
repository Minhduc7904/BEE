import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import type { Response } from 'express'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  AchievementBoardListQueryDto,
  AchievementBoardResponseDto,
  AchievementRowResponseDto,
  AchievementRowsImportResultDto,
  BaseResponseDto,
  CreateAchievementBoardDto,
  PaginationResponseDto,
  UpdateAchievementBoardDto,
  UpdateAchievementRowDto,
} from 'src/application/dtos'
import {
  CreateAchievementBoardUseCase,
  DeleteAchievementBoardUseCase,
  DeleteAchievementRowUseCase,
  ExportAchievementRowTemplateUseCase,
  GetAchievementBoardsUseCase,
  ImportAchievementRowsUseCase,
  UpdateAchievementBoardUseCase,
  UpdateAchievementRowUseCase,
} from 'src/application/use-cases/achievement'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { Visibility } from 'src/shared/enums'
import { FileSizeByRoleInterceptor } from 'src/shared/interceptors/file-size-by-role.interceptor'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('achievement-boards')
export class AchievementBoardController {
  constructor(
    private readonly createAchievementBoardUseCase: CreateAchievementBoardUseCase,
    private readonly updateAchievementBoardUseCase: UpdateAchievementBoardUseCase,
    private readonly deleteAchievementBoardUseCase: DeleteAchievementBoardUseCase,
    private readonly getAchievementBoardsUseCase: GetAchievementBoardsUseCase,
    private readonly updateAchievementRowUseCase: UpdateAchievementRowUseCase,
    private readonly deleteAchievementRowUseCase: DeleteAchievementRowUseCase,
    private readonly exportAchievementRowTemplateUseCase: ExportAchievementRowTemplateUseCase,
    private readonly importAchievementRowsUseCase: ImportAchievementRowsUseCase,
  ) {}

  @Post()
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  /**
   * Endpoint: POST /achievement-boards
   *
   * Request body:
   * - auto?: boolean = true. Neu true, backend goi AI sinh cac truong SEO con thieu.
   * - title: string
   * - competitionName: string
   * - academicYear?: string
   * - description?: string
   * - shortDescription?: string
   * - slug?: string
   * - SEO fields?: targetKeyword, keywordText, metaTitle, metaDescription, ogTitle, ogDescription, searchIntent, seoScore
   * - visibility?: DRAFT | PUBLISHED
   * - isFeatured?: boolean
   * - sortOrder?: number
   *
   * Response:
   * BaseResponseDto<AchievementBoardResponseDto>, trong do data la bang thanh tich da tao kem rows rong.
   */
  async createBoard(
    @Body() dto: CreateAchievementBoardDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<AchievementBoardResponseDto>> {
    return ExceptionHandler.execute(() => this.createAchievementBoardUseCase.execute(dto, userId))
  }

  @Get()
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async getBoards(
    @Query() query: AchievementBoardListQueryDto,
  ): Promise<PaginationResponseDto<AchievementBoardResponseDto>> {
    return ExceptionHandler.execute(() => this.getAchievementBoardsUseCase.execute(query))
  }

  @Get('public/seo')
  @HttpCode(HttpStatus.OK)
  /**
   * Endpoint: GET /api/achievement-boards/public/seo
   *
   * Muc dich:
   * - Lay danh sach bang thanh tich public de hien thi tren trang SEO.
   * - API public, khong can Authorization/JWT.
   * - Backend tu ep visibility = PUBLISHED va includeRows = true, nen chi tra bang thanh tich da publish kem day du dong thanh tich.
   *
   * Request query:
   * - page?: number = 1
   * - limit?: number = 10
   * - search?: string
   * - isFeatured?: boolean
   * - sortBy?: achievementBoardId | title | slug | competitionName | academicYear | visibility | isFeatured | viewCount | sortOrder | createdAt | updatedAt
   * - sortOrder?: asc | desc
   *
   * Query bi backend override:
   * - visibility luon la PUBLISHED
   * - includeRows luon la true
   *
   * Response:
   * PaginationResponseDto<AchievementBoardResponseDto>
   *
   * Response example:
   * {
   *   "success": true,
   *   "message": "Lay danh sach bang thanh tich thanh cong",
   *   "data": [
   *     {
   *       "achievementBoardId": 1,
   *       "title": "Bang vang thanh tich HSG Toan",
   *       "slug": "bang-vang-thanh-tich-hsg-toan",
   *       "competitionName": "Ky thi hoc sinh gioi Toan",
   *       "academicYear": "2025-2026",
   *       "description": "Mo ta day du ve bang thanh tich",
   *       "shortDescription": "Mo ta ngan hien thi tren SEO",
   *       "targetKeyword": "bang thanh tich hoc sinh gioi toan",
   *       "keywordText": "hoc sinh gioi toan, bang vang thanh tich",
   *       "metaTitle": "Bang vang thanh tich HSG Toan 2025-2026",
   *       "metaDescription": "Danh sach hoc sinh dat thanh tich cao trong ky thi HSG Toan.",
   *       "ogTitle": "Bang vang thanh tich HSG Toan",
   *       "ogDescription": "Cac hoc sinh dat thanh tich noi bat.",
   *       "searchIntent": "competition results",
   *       "seoScore": 85,
   *       "visibility": "PUBLISHED",
   *       "isFeatured": true,
   *       "viewCount": 0,
   *       "sortOrder": 0,
   *       "createdBy": 1,
   *       "updatedBy": 1,
   *       "createdAt": "2026-07-06T03:00:00.000Z",
   *       "updatedAt": "2026-07-06T03:00:00.000Z",
   *       "rows": [
   *         {
   *           "achievementRowId": 1,
   *           "achievementBoardId": 1,
   *           "studentName": "Nguyen Van A",
   *           "schoolName": "THCS Nguyen Du",
   *           "grade": 9,
   *           "score": 18.5,
   *           "sortOrder": 0,
   *           "createdAt": "2026-07-06T03:00:00.000Z",
   *           "updatedAt": "2026-07-06T03:00:00.000Z"
   *         }
   *       ]
   *     }
   *   ],
   *   "meta": {
   *     "page": 1,
   *     "limit": 10,
   *     "total": 1,
   *     "totalPages": 1,
   *     "hasPrevious": false,
   *     "hasNext": false
   *   }
   * }
   */
  async getPublicSeoBoards(
    @Query() query: AchievementBoardListQueryDto,
  ): Promise<PaginationResponseDto<AchievementBoardResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    query.includeRows = true
    return ExceptionHandler.execute(() => this.getAchievementBoardsUseCase.execute(query))
  }

  @Get('rows/template')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async exportRowsTemplate(@Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    return ExceptionHandler.execute(async () => {
      const { buffer, filename } = await this.exportAchievementRowTemplateUseCase.execute()

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      })

      return new StreamableFile(buffer)
    })
  }

  @Put('rows/:achievementRowId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async updateRow(
    @Param('achievementRowId', ParseIntPipe) achievementRowId: number,
    @Body() dto: UpdateAchievementRowDto,
  ): Promise<BaseResponseDto<AchievementRowResponseDto>> {
    return ExceptionHandler.execute(() => this.updateAchievementRowUseCase.execute(achievementRowId, dto))
  }

  @Delete('rows/:achievementRowId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async deleteRow(
    @Param('achievementRowId', ParseIntPipe) achievementRowId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteAchievementRowUseCase.execute(achievementRowId))
  }

  @Post(':achievementBoardId/rows/import-excel')
  @UseInterceptors(FileInterceptor('file'), FileSizeByRoleInterceptor)
  @RequirePermission()
  @HttpCode(HttpStatus.CREATED)
  async importRows(
    @Param('achievementBoardId', ParseIntPipe) achievementBoardId: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BaseResponseDto<AchievementRowsImportResultDto>> {
    return ExceptionHandler.execute(() => this.importAchievementRowsUseCase.execute(achievementBoardId, file))
  }

  @Put(':achievementBoardId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async updateBoard(
    @Param('achievementBoardId', ParseIntPipe) achievementBoardId: number,
    @Body() dto: UpdateAchievementBoardDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<AchievementBoardResponseDto>> {
    return ExceptionHandler.execute(() => this.updateAchievementBoardUseCase.execute(achievementBoardId, dto, userId))
  }

  @Delete(':achievementBoardId')
  @RequirePermission()
  @HttpCode(HttpStatus.OK)
  async deleteBoard(
    @Param('achievementBoardId', ParseIntPipe) achievementBoardId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteAchievementBoardUseCase.execute(achievementBoardId))
  }
}
