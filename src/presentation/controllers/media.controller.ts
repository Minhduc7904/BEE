import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileSizeByRoleInterceptor } from '../../shared/interceptors/file-size-by-role.interceptor'
import { Injectable } from '@nestjs/common'
import {
  UploadMediaUseCase,
  GetMediaUseCase,
  GetMediaListUseCase,
  GetBucketsListUseCase,
  UpdateMediaUseCase,
  DeleteMediaUseCase,
  GetMediaDownloadUrlUseCase,
  GetMediaViewUrlUseCase,
  GetBatchMyMediaViewUrlUseCase,
  GetMyMediaDownloadUrlUseCase,
  GetMyMediaViewUrlUseCase,
  CreatePresignedUploadUseCase,
  CompletePresignedUploadUseCase,
  GetBucketStatisticsUseCase,
  GetAdminMediaViewUrlUseCase,
  GetAdminMediaDownloadUrlUseCase,
  ExtractMediaTextUseCase,
  GetAdminMediaRawContentUseCase,
  GetMyMediaRawContentUseCase,
} from '../../application/use-cases'
import {
  UploadMediaDto,
  UpdateMediaDto,
  GetMediaListDto,
  MediaResponseDto,
  GetBatchMediaViewUrlDto,
  MediaViewRequestDto,
  MediaViewResponseDto,
  MediaDownloadResponseDto,
  CreatePresignedUploadDto,
  PresignedUploadResponseDto,
  CompleteUploadDto,
  ExtractMediaTextDto,
  MediaTextExtractionResponseDto,
  MediaRawContentResponseDto,
} from '../../application/dtos/media'
import { BaseResponseDto } from '../../application/dtos'
import { PaginationResponseDto } from '../../application/dtos/pagination/pagination-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { RequirePermission } from '../../shared/decorators/permissions.decorator'
import { CurrentUser } from '../../shared/decorators'
import { PERMISSION_CODES } from '../../shared/constants/permissions/permission.codes'
import { BucketStatisticsResponseDto } from 'src/application/dtos/media-folder'

@Injectable()
@Controller('media')
export class MediaController {
  constructor(
    private readonly uploadMediaUseCase: UploadMediaUseCase,
    private readonly getMediaUseCase: GetMediaUseCase,
    private readonly getMediaListUseCase: GetMediaListUseCase,
    private readonly getBucketsListUseCase: GetBucketsListUseCase,
    private readonly updateMediaUseCase: UpdateMediaUseCase,
    private readonly deleteMediaUseCase: DeleteMediaUseCase,
    private readonly getMediaDownloadUrlUseCase: GetMediaDownloadUrlUseCase,
    private readonly getMediaViewUrlUseCase: GetMediaViewUrlUseCase,
    private readonly getBatchMyMediaViewUrlUseCase: GetBatchMyMediaViewUrlUseCase,
    private readonly getMyMediaViewUrlUseCase: GetMyMediaViewUrlUseCase,
    private readonly getMyMediaDownloadUrlUseCase: GetMyMediaDownloadUrlUseCase,
    private readonly createPresignedUploadUseCase: CreatePresignedUploadUseCase,
    private readonly completePresignedUploadUseCase: CompletePresignedUploadUseCase,
    private readonly getBucketStatisticsUseCase: GetBucketStatisticsUseCase,
    private readonly getAdminMediaViewUrlUseCase: GetAdminMediaViewUrlUseCase,
    private readonly getAdminMediaDownloadUrlUseCase: GetAdminMediaDownloadUrlUseCase,
    private readonly extractMediaTextUseCase: ExtractMediaTextUseCase,
    private readonly getAdminMediaRawContentUseCase: GetAdminMediaRawContentUseCase,
    private readonly getMyMediaRawContentUseCase: GetMyMediaRawContentUseCase,
  ) { }

  @UseInterceptors(
    FileInterceptor('file'),
    FileSizeByRoleInterceptor,
  )
  @Post('upload')
  @RequirePermission(PERMISSION_CODES.MEDIA_UPLOAD)
  @HttpCode(HttpStatus.CREATED)
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.uploadMediaUseCase.execute(file, userId, dto),
    )
  }

  @Post('upload/presigned')
  @RequirePermission(PERMISSION_CODES.MEDIA_UPLOAD)
  @HttpCode(HttpStatus.OK)
  async createPresignedUpload(
    @Body() dto: CreatePresignedUploadDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<PresignedUploadResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.createPresignedUploadUseCase.execute(dto, userId),
    )
  }

  @Post('upload/complete')
  @RequirePermission(PERMISSION_CODES.MEDIA_UPLOAD)
  @HttpCode(HttpStatus.OK)
  async completePresignedUpload(
    @Body() dto: CompleteUploadDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.completePresignedUploadUseCase.execute(dto, userId),
    )
  }


  @Get()
  @RequirePermission(PERMISSION_CODES.MEDIA_GET_ALL)
  @HttpCode(HttpStatus.OK)
  async getMediaList(
    @Query() dto: GetMediaListDto,
    @CurrentUser('userId') userId?: number,
  ): Promise<PaginationResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.getMediaListUseCase.execute(dto, userId))
  }

  @Get('my')
  @RequirePermission(PERMISSION_CODES.MEDIA_GET_MY_MEDIA)
  @HttpCode(HttpStatus.OK)
  async getMyMediaList(
    @Query() dto: GetMediaListDto,
    @CurrentUser('userId') userId: number,
  ): Promise<PaginationResponseDto<MediaResponseDto>> {
    dto.uploadedBy = userId
    return ExceptionHandler.execute(() => this.getMediaListUseCase.execute(dto, userId))
  }

  /**
   * Get all available buckets
   */
  @Get('buckets')
  @RequirePermission(PERMISSION_CODES.MEDIA_GET_BUCKETS)
  @HttpCode(HttpStatus.OK)
  async getBuckets(): Promise<
    BaseResponseDto<{ data: Array<{ name: string; label: string; description: string }>; total: number }>
  > {
    return ExceptionHandler.execute(() => this.getBucketsListUseCase.execute())
  }

  @Get(':id')
  @RequirePermission(PERMISSION_CODES.MEDIA_GET_BY_ID)
  @HttpCode(HttpStatus.OK)
  async getMedia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.getMediaUseCase.execute(id))
  }

  @Put(':id')
  @RequirePermission(PERMISSION_CODES.MEDIA_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMediaDto,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.updateMediaUseCase.execute(id, dto))
  }

  /**
   * Generate presigned download URL for media
   * URL expires after specified time (default: 1 hour)
   */
  @Get(':id/download')
  @RequirePermission(PERMISSION_CODES.MEDIA_DOWNLOAD)
  @HttpCode(HttpStatus.OK)
  async getMediaDownloadUrl(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query() context: MediaViewRequestDto,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId?: number,
  ): Promise<
    BaseResponseDto<MediaDownloadResponseDto>
  > {
    return ExceptionHandler.execute(() =>
      this.getMediaDownloadUrlUseCase.execute({
        mediaId,
        context,
        userId,
        expirySeconds,
      }),
    )
  }

  /**
   * Generate presigned URL for viewing/previewing media
   * URL expires after specified time (default: 1 hour)
   * Opens inline in browser (vs download forces download)
   */
  @Get(':id/view')
  @HttpCode(HttpStatus.OK)
  async getMediaViewUrl(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query() context: MediaViewRequestDto,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId?: number,
  ): Promise<BaseResponseDto<MediaViewResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getMediaViewUrlUseCase.execute({
        mediaId,
        context,
        userId,
        expirySeconds,
      }),
    )
  }

  @Get(':id/view/my')
  @RequirePermission(PERMISSION_CODES.MEDIA_VIEW_MY)
  @HttpCode(HttpStatus.OK)
  async getMyMediaViewUrl(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaViewResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getMyMediaViewUrlUseCase.execute({
        mediaId,
        userId,
        expirySeconds,
      }),
    )
  }

  @Get('admin/:id/view')
  @RequirePermission(PERMISSION_CODES.MEDIA_ADMIN_VIEW)
  @HttpCode(HttpStatus.OK)
  async getAdminMediaViewUrl(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
  ): Promise<BaseResponseDto<MediaViewResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getAdminMediaViewUrlUseCase.execute({
        mediaId,
        expirySeconds,
      }),
    )
  }

  @Get('admin/:id/download')
  @RequirePermission(PERMISSION_CODES.MEDIA_ADMIN_DOWNLOAD)
  @HttpCode(HttpStatus.OK)
  async getAdminMediaDownloadUrl(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
  ): Promise<BaseResponseDto<MediaDownloadResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getAdminMediaDownloadUrlUseCase.execute({
        mediaId,
        expirySeconds,
      }),
    )
  }


  @Get(':id/download/my')
  @RequirePermission(PERMISSION_CODES.MEDIA_DOWNLOAD_MY)
  @HttpCode(HttpStatus.OK)
  async getMyMediaDownloadUrl(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId: number,
  ): Promise<
    BaseResponseDto<MediaDownloadResponseDto>
  > {
    return ExceptionHandler.execute(() =>
      this.getMyMediaDownloadUrlUseCase.execute({
        mediaId,
        userId,
        expirySeconds,
      }),
    )
  }

  /**
   * Generate presigned URLs for viewing multiple media files
   * Accepts array of media IDs (max 100)
   * Returns URL for each valid media with error handling
   */
  @Post('batch/view/my')
  @RequirePermission(PERMISSION_CODES.MEDIA_VIEW_MY)
  @HttpCode(HttpStatus.OK)
  async getBatchMediaViewUrl(
    @Body() dto: GetBatchMediaViewUrlDto,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() =>
      this.getBatchMyMediaViewUrlUseCase.execute(dto.mediaIds, expirySeconds, userId),
    )
  }

  @Get('statistics/buckets')
  @RequirePermission(PERMISSION_CODES.MEDIA_GET_STATISTICS_BUCKETS)
  @HttpCode(HttpStatus.OK)
  async getStatisticsBuckets(): Promise<BaseResponseDto<BucketStatisticsResponseDto>> {
    return ExceptionHandler.execute(() => {
      return this.getBucketStatisticsUseCase.execute()
    })
  }

  /**
   * Get raw content with presigned URLs for admin
   * Admin can view any media's raw content
   */
  @Get('admin/:id/raw-content')
  @RequirePermission(PERMISSION_CODES.MEDIA_ADMIN_VIEW)
  @HttpCode(HttpStatus.OK)
  async getAdminMediaRawContent(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getAdminMediaRawContentUseCase.execute(mediaId, expirySeconds),
    )
  }

  /**
   * Extract text from PDF or image using Mistral AI OCR
   */
  @Post(':id/extract-text')
  @RequirePermission(PERMISSION_CODES.MEDIA_GET_MY_MEDIA)
  @HttpCode(HttpStatus.OK)
  async extractMediaText(
    @Param('id', ParseIntPipe) mediaId: number,
    @Body() dto: ExtractMediaTextDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaTextExtractionResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.extractMediaTextUseCase.execute({
        mediaId,
        userId,
        includeImageBase64: dto.includeImageBase64,
      }),
    )
  }

  /**
   * Get raw content with presigned URLs for my media
   * Can only view raw content of media uploaded by self
   */
  @Get(':id/raw-content/my')
  @RequirePermission(PERMISSION_CODES.MEDIA_VIEW_MY)
  @HttpCode(HttpStatus.OK)
  async getMyMediaRawContent(
    @Param('id', ParseIntPipe) mediaId: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaRawContentResponseDto>> {
    return ExceptionHandler.execute(() =>
      this.getMyMediaRawContentUseCase.execute(mediaId, userId, expirySeconds),
    )
  }

  /**
   * Soft delete media - marks as DELETED (default, safer)
   * Media file remains in storage, can be restored
   */
  @Delete(':id')
  @RequirePermission(PERMISSION_CODES.MEDIA_DELETE)
  @HttpCode(HttpStatus.OK)
  async softDeleteMedia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() =>
      this.deleteMediaUseCase.executeSoftDelete(id),
    )
  }

  /**
   * Hard delete media - permanently removes from storage
   * WARNING: This action cannot be undone
   */
  @Delete(':id/permanent')
  @RequirePermission(PERMISSION_CODES.MEDIA_PERMANENT_DELETE)
  @HttpCode(HttpStatus.OK)
  async hardDeleteMedia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() =>
      this.deleteMediaUseCase.executeHardDelete(id),
    )
  }

  @Delete(':id/my')
  @RequirePermission(PERMISSION_CODES.MEDIA_DELETE_MY)
  @HttpCode(HttpStatus.OK)
  async deleteMyMedia(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() =>
      this.deleteMediaUseCase.executeSoftDeleteByUser(id, userId),
    )
  }
}
