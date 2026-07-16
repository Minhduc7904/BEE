import { BadRequestException, Injectable } from '@nestjs/common'
import { Readable } from 'stream'
import { BaseResponseDto } from 'src/application/dtos'
import { SeoMediaUploadResponseDto, UploadSeoMediaDto } from 'src/application/dtos/seo-media'
import { MediaType } from 'src/shared/enums'
import { MediaProcessingService } from 'src/application/interfaces'
import { MinioService } from 'src/application/interfaces'
import { buildPublicObjectPath, detectMediaType, generateObjectKey, sanitizeFilename } from 'src/shared/utils'

@Injectable()
export class UploadSeoMediaUseCase {
  constructor(
    private readonly minioService: MinioService,
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  async execute(
    file: Express.Multer.File,
    userId: number,
    dto?: UploadSeoMediaDto,
  ): Promise<BaseResponseDto<SeoMediaUploadResponseDto>> {
    void userId
    void dto

    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided')
    }

    const detectedMediaType = detectMediaType(file.mimetype)
    const isSupported = [MediaType.IMAGE, MediaType.VIDEO].includes(detectedMediaType)
    if (!isSupported) {
      throw new BadRequestException('SEO media upload only supports image and video files')
    }

    let uploadBuffer = file.buffer
    let uploadMimeType = file.mimetype
    let width: number | undefined
    let height: number | undefined
    let duration: number | undefined

    const optimized = await this.mediaProcessingService.optimize({
      buffer: file.buffer,
      mimeType: file.mimetype,
      mediaType: detectedMediaType,
    })

    if (optimized) {
      uploadBuffer = optimized.buffer
      uploadMimeType = optimized.mimeType
      width = optimized.width ?? undefined
      height = optimized.height ?? undefined
      duration = optimized.duration ?? undefined
    }

    const mediaDirectory = detectedMediaType === MediaType.IMAGE ? 'images' : 'videos'
    const fallbackName = detectedMediaType === MediaType.IMAGE ? 'seo_image' : 'seo_video'
    const sanitizedOriginalName = sanitizeFilename(file.originalname, {
      fallbackName,
      overrideExtension: optimized?.extension,
    })

    const objectKey = generateObjectKey(mediaDirectory, sanitizedOriginalName)
    const bucketName = this.minioService.getBuckets().seoMedia

    const stream = Readable.from(uploadBuffer)
    await this.minioService.uploadFileStream(bucketName, objectKey, stream, {
      'Content-Type': uploadMimeType,
      'Original-Name': sanitizedOriginalName,
    })

    return BaseResponseDto.success(
      'SEO media uploaded successfully',
      SeoMediaUploadResponseDto.fromData({
        bucketName,
        objectKey,
        publicUrl: buildPublicObjectPath(bucketName, objectKey),
        originalName: sanitizedOriginalName,
        mediaType: detectedMediaType,
        mimeType: uploadMimeType,
        fileSize: uploadBuffer.length,
        width,
        height,
        duration,
      }),
    )
  }
}
