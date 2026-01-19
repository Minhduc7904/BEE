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
import {
  UploadMediaUseCase,
  GetMediaUseCase,
  GetMediaListUseCase,
  GetBucketsListUseCase,
  UpdateMediaUseCase,
  DeleteMediaUseCase,
  GetMediaDownloadUrlUseCase,
  GetMediaViewUrlUseCase,
  GetBatchMediaViewUrlUseCase,
  GetBucketStatisticsUseCase,
} from '../../application/use-cases'
import {
  UploadMediaDto,
  UpdateMediaDto,
  GetMediaListDto,
  MediaResponseDto,
  GetBatchMediaViewUrlDto,
} from '../../application/dtos/media'
import { BaseResponseDto } from '../../application/dtos'
import { PaginationResponseDto } from '../../application/dtos/pagination/pagination-response.dto'
import { ExceptionHandler } from '../../shared/utils/exception-handler.util'
import { AuthOnly } from '../../shared/decorators/permission.decorator'
import { CurrentUser, RequirePermission } from '../../shared/decorators'
import { BucketStatisticsResponseDto } from 'src/application/dtos/media-folder/bucket-statistics-response.dto'

@Controller('media')
@AuthOnly()
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
    private readonly getBatchMediaViewUrlUseCase: GetBatchMediaViewUrlUseCase,
    private readonly getBucketStatisticsUseCase: GetBucketStatisticsUseCase,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser('userId') userId: number,
  ): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.uploadMediaUseCase.execute(file, userId, dto))
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMediaList(@Query() dto: GetMediaListDto): Promise<PaginationResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.getMediaListUseCase.execute(dto))
  }

  /**
   * Get all available buckets
   */
  @Get('buckets')
  @HttpCode(HttpStatus.OK)
  async getBuckets(): Promise<
    BaseResponseDto<{ data: Array<{ name: string; label: string; description: string }>; total: number }>
  > {
    return ExceptionHandler.execute(() => this.getBucketsListUseCase.execute())
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getMedia(@Param('id', ParseIntPipe) id: number): Promise<BaseResponseDto<MediaResponseDto>> {
    return ExceptionHandler.execute(() => this.getMediaUseCase.execute(id))
  }

  @Put(':id')
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
  @HttpCode(HttpStatus.OK)
  async getMediaDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
  ): Promise<
    BaseResponseDto<{
      mediaId: number
      downloadUrl: string
      expiresAt: Date
      expirySeconds: number
      filename: string
      mimeType: string
      fileSize: number
    }>
  > {
    return ExceptionHandler.execute(() => this.getMediaDownloadUrlUseCase.execute(id, expirySeconds))
  }

  /**
   * Generate presigned URL for viewing/previewing media
   * URL expires after specified time (default: 1 hour)
   * Opens inline in browser (vs download forces download)
   */
  @Get(':id/view')
  @HttpCode(HttpStatus.OK)
  async getMediaViewUrl(
    @Param('id', ParseIntPipe) id: number,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
  ): Promise<
    BaseResponseDto<{
      mediaId: number
      viewUrl: string
      expiresAt: Date
      expirySeconds: number
      filename: string
      mimeType: string
      fileSize: number
      type: string
    }>
  > {
    return ExceptionHandler.execute(() => this.getMediaViewUrlUseCase.execute(id, expirySeconds))
  }

  /**
   * Generate presigned URLs for viewing multiple media files
   * Accepts array of media IDs (max 100)
   * Returns URL for each valid media with error handling
   */
  @Post('batch/view')
  @HttpCode(HttpStatus.OK)
  async getBatchMediaViewUrl(
    @Body() dto: GetBatchMediaViewUrlDto,
    @Query('expiry', new DefaultValuePipe(3600), ParseIntPipe) expirySeconds: number,
  ): Promise<BaseResponseDto<any>> {
    return ExceptionHandler.execute(() => this.getBatchMediaViewUrlUseCase.execute(dto.mediaIds, expirySeconds))
  }

  /**
   * Soft delete media - marks as DELETED (default, safer)
   * Media file remains in storage, can be restored
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async softDeleteMedia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteMediaUseCase.executeSoftDelete(id))
  }

  /**
   * Hard delete media - permanently removes from storage
   * WARNING: This action cannot be undone
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  async hardDeleteMedia(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<{ deleted: boolean; message: string }>> {
    return ExceptionHandler.execute(() => this.deleteMediaUseCase.executeHardDelete(id))
  }

  /**
   * Get bucket statistics (file count and size for all buckets)
   */
  @Get('statistics/buckets')
  @RequirePermission('media.buckets.view')
  @HttpCode(HttpStatus.OK)
  async getBucketStatistics(): Promise<BaseResponseDto<BucketStatisticsResponseDto>> {
    return ExceptionHandler.execute(() => this.getBucketStatisticsUseCase.execute())
  }
}
