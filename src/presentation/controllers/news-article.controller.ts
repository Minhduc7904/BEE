import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common'
import {
  BaseResponseDto,
  CreateNewsArticleDto,
  NewsArticleListQueryDto,
  NewsArticleResponseDto,
  PaginationResponseDto,
  UpdateNewsArticleDto,
  PublicSeoSitemapQueryDto,
  PublicSeoSitemapResponseDto,
} from 'src/application/dtos'
import {
  CreateNewsArticleUseCase,
  DeleteNewsArticleUseCase,
  GetNewsArticleByIdUseCase,
  GetNewsArticlesUseCase,
  GetPublicSeoFeaturedNewsArticlesUseCase,
  GetPublicSeoLatestNewsArticlesUseCase,
  GetPublicSeoNewsArticleBySlugUseCase,
  IncrementPublicNewsArticleViewCountUseCase,
  UpdateNewsArticleUseCase,
  GetPublicSeoNewsSitemapUseCase,
} from 'src/application/use-cases/news'
import { CurrentUser } from 'src/shared/decorators'
import { RequirePermission } from 'src/shared/decorators/permissions.decorator'
import { PERMISSION_CODES } from 'src/shared/constants/permissions/permission.codes'
import { Visibility } from 'src/shared/enums'
import { ExceptionHandler } from 'src/shared/utils/exception-handler.util'

@Controller('news-articles')
export class NewsArticleController {
  constructor(
    private readonly createNewsArticleUseCase: CreateNewsArticleUseCase,
    private readonly updateNewsArticleUseCase: UpdateNewsArticleUseCase,
    private readonly deleteNewsArticleUseCase: DeleteNewsArticleUseCase,
    private readonly getNewsArticlesUseCase: GetNewsArticlesUseCase,
    private readonly getNewsArticleByIdUseCase: GetNewsArticleByIdUseCase,
    private readonly incrementPublicNewsArticleViewCountUseCase: IncrementPublicNewsArticleViewCountUseCase,
    private readonly getPublicSeoNewsArticleBySlugUseCase: GetPublicSeoNewsArticleBySlugUseCase,
    private readonly getPublicSeoFeaturedNewsArticlesUseCase: GetPublicSeoFeaturedNewsArticlesUseCase,
    private readonly getPublicSeoLatestNewsArticlesUseCase: GetPublicSeoLatestNewsArticlesUseCase,
    private readonly getPublicSeoNewsSitemapUseCase: GetPublicSeoNewsSitemapUseCase,
  ) {}

  /**
   * Endpoint: POST /news-articles
   * Permission: news-article:create
   *
   * Request body:
   * - type: NEWS | ANNOUNCEMENT | GUIDE | EVENT | LEARNING | COURSE_MEMORY
   * - title: string
   * - contentJson: Tiptap JSON. Node co media phai dung attrs.mediaId la ID media so nguyen duong.
   * - thumbnailMediaId?: number | null
   * - contentHtml?: string. Dung media:<mediaId> trong src, backend se thay bang presigned URL khi doc.
   * - Cac truong SEO va hien thi: auto?: boolean = true, excerpt, authorName, publishedAt, targetKeyword,
   *   keywordText, metaTitle, metaDescription, ogTitle, ogDescription, canonicalUrl,
   *   searchIntent, seoScore, structuredData, visibility, isFeatured, readingTime, sortOrder.
   *
   * Response: BaseResponseDto<NewsArticleResponseDto>.
   * contentJson van co attrs.mediaId va duoc them attrs.src/attrs.viewUrl tam thoi de Tiptap render.
   */
  @Post()
  @RequirePermission(PERMISSION_CODES.NEWS_ARTICLE.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateNewsArticleDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.createNewsArticleUseCase.execute(dto, userId))
  }

  /**
   * Endpoint: POST /news-articles/public/seo/:slug/view
   * Authentication: public, khong can JWT.
   *
   * Path param: slug la slug cua bai viet da PUBLISHED.
   * Request body: khong co.
   * Response: { success: true, message: string, data: { viewCount: number } }.
   * Chi bai viet PUBLISHED moi duoc tang luot xem.
   */
  @Post('public/seo/:slug/view')
  @HttpCode(HttpStatus.OK)
  async incrementPublicSeoViewCount(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<{ viewCount: number }>> {
    return ExceptionHandler.execute(() => this.incrementPublicNewsArticleViewCountUseCase.execute(slug))
  }

  /**
   * Endpoint: GET /news-articles/public/seo
   * Authentication: public, khong can JWT.
   * Query: page, limit, search, type, isFeatured, sortBy, sortOrder.
   * Response: PaginationResponseDto<NewsArticleResponseDto> chi gom bai viet PUBLISHED kem presigned media URLs.
   */
  @Get('public/seo')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoList(
    @Query() query: NewsArticleListQueryDto,
  ): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    query.visibility = Visibility.PUBLISHED
    return ExceptionHandler.execute(() => this.getNewsArticlesUseCase.execute(query))
  }

  @Get('public/seo/sitemap')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoSitemap(@Query() query: PublicSeoSitemapQueryDto): Promise<PublicSeoSitemapResponseDto> {
    return ExceptionHandler.execute(() => this.getPublicSeoNewsSitemapUseCase.execute(query))
  }

  /**
   * Endpoint: GET /news-articles/public/seo/featured
   * Authentication: public, khong can JWT.
   * Query: page, limit, search, type, sortBy, sortOrder.
   * Response: PaginationResponseDto<NewsArticleResponseDto> chi gom bai PUBLISHED va isFeatured = true.
   */
  @Get('public/seo/featured')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoFeatured(
    @Query() query: NewsArticleListQueryDto,
  ): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoFeaturedNewsArticlesUseCase.execute(query))
  }

  /**
   * Endpoint: GET /news-articles/public/seo/latest
   * Authentication: public, khong can JWT.
   * Query: page, limit, search, type, isFeatured.
   * Response: PaginationResponseDto<NewsArticleResponseDto> chi gom bai PUBLISHED, sap xep publishedAt giam dan.
   */
  @Get('public/seo/latest')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoLatest(
    @Query() query: NewsArticleListQueryDto,
  ): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoLatestNewsArticlesUseCase.execute(query))
  }

  /**
   * Endpoint: GET /news-articles/public/seo/:slug
   * Authentication: public, khong can JWT.
   * Path param: slug cua bai viet PUBLISHED.
   * Response: BaseResponseDto<NewsArticleResponseDto> bao gom contentJson Tiptap, contentHtml va presigned media URLs.
   */
  @Get('public/seo/:slug')
  @HttpCode(HttpStatus.OK)
  async getPublicSeoBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.getPublicSeoNewsArticleBySlugUseCase.execute(slug))
  }

  /**
   * Endpoint: GET /news-articles
   * Permission: news-article:get-all
   *
   * Query: page, limit, search, sortBy, sortOrder, type, visibility, isFeatured.
   * sortBy ho tro: newsArticleId, type, title, slug, authorName, publishedAt, visibility,
   * isFeatured, viewCount, readingTime, sortOrder, createdAt, updatedAt.
   *
   * Response: PaginationResponseDto<NewsArticleResponseDto>.
   * Danh sach chi co thumbnailViewUrl; khong tra contentJson, contentText, contentMedia
   * va khong tao presigned URL cho media trong noi dung.
   */
  @Get()
  @RequirePermission(PERMISSION_CODES.NEWS_ARTICLE.GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query() query: NewsArticleListQueryDto,
  ): Promise<PaginationResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.getNewsArticlesUseCase.execute(query))
  }

  /**
   * Endpoint: GET /news-articles/:newsArticleId
   * Permission: news-article:get-by-id
   *
   * Path param: newsArticleId la ID so nguyen cua bai viet.
   * Response: BaseResponseDto<NewsArticleResponseDto>, bao gom Tiptap JSON co mediaId va presigned src/viewUrl.
   */
  @Get(':newsArticleId')
  @RequirePermission(PERMISSION_CODES.NEWS_ARTICLE.GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('newsArticleId', ParseIntPipe) newsArticleId: number,
  ): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.getNewsArticleByIdUseCase.execute(newsArticleId))
  }

  /**
   * Endpoint: PUT /news-articles/:newsArticleId
   * Permission: news-article:update
   *
   * Path param: newsArticleId la ID so nguyen cua bai viet.
   * Request body: cac truong can cap nhat cua POST /news-articles.
   * - Gui contentJson de thay noi dung. Backend chi luu attrs.mediaId, go bo MediaUsage cua media khong con trong content,
   *   va gan MediaUsage cho media moi.
   * - Gui thumbnailMediaId de thay thumbnail; gui null de go thumbnail.
   *
   * Response: BaseResponseDto<NewsArticleResponseDto> da duoc cap nhat kem presigned URL.
   */
  @Put(':newsArticleId')
  @RequirePermission(PERMISSION_CODES.NEWS_ARTICLE.UPDATE)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('newsArticleId', ParseIntPipe) newsArticleId: number,
    @Body() dto: UpdateNewsArticleDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<NewsArticleResponseDto>> {
    return ExceptionHandler.execute(() => this.updateNewsArticleUseCase.execute(newsArticleId, dto, userId))
  }

  /**
   * Endpoint: DELETE /news-articles/:newsArticleId
   * Permission: news-article:delete
   *
   * Path param: newsArticleId la ID so nguyen cua bai viet.
   * Response: { success: true, message: string, data: { deleted: true, message: string } }.
   * Backend xoa tat ca MediaUsage cua thumbnail va content truoc khi xoa bai viet; khong xoa file Media goc.
   */
  @Delete(':newsArticleId')
  @RequirePermission(PERMISSION_CODES.NEWS_ARTICLE.DELETE)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('newsArticleId', ParseIntPipe) newsArticleId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteNewsArticleUseCase.execute(newsArticleId))
  }
}
