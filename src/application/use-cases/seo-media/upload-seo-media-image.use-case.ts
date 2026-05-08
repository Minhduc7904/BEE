import { BadRequestException, Injectable } from '@nestjs/common'
import { Readable } from 'stream'
import { BaseResponseDto } from 'src/application/dtos'
import {
  SeoMediaUploadImageResponseDto,
  UploadSeoMediaImageDto,
} from 'src/application/dtos/seo-media'
import { MediaType } from 'src/shared/enums'
import { MediaProcessingService } from 'src/infrastructure/services/media-processing.service'
import { MinioService } from 'src/infrastructure/services/minio.service'
import {
  buildPublicObjectPath,
  detectMediaType,
  generateObjectKey,
  sanitizeFilename,
} from 'src/shared/utils'

@Injectable()
export class UploadSeoMediaImageUseCase {
  constructor(
    private readonly minioService: MinioService,
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  async execute(
    file: Express.Multer.File,
    userId: number,
    dto?: UploadSeoMediaImageDto,
  ): Promise<BaseResponseDto<SeoMediaUploadImageResponseDto>> {
    void userId
    void dto

    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided')
    }

    const detectedMediaType = detectMediaType(file.mimetype)
    if (detectedMediaType !== MediaType.IMAGE) {
      throw new BadRequestException('SEO media upload only supports image files')
    }

    let uploadBuffer = file.buffer
    let uploadMimeType = file.mimetype
    let width: number | undefined
    let height: number | undefined

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
    }

    const sanitizedOriginalName = sanitizeFilename(file.originalname, {
      fallbackName: 'seo_image',
      overrideExtension: optimized?.extension,
    })

    const objectKey = generateObjectKey('images', sanitizedOriginalName)
    const bucketName = this.minioService.getBuckets().seoMedia

    const stream = Readable.from(uploadBuffer)
    await this.minioService.uploadFileStream(bucketName, objectKey, stream, {
      'Content-Type': uploadMimeType,
      'Original-Name': sanitizedOriginalName,
    })

    return BaseResponseDto.success(
      'SEO image uploaded successfully',
      SeoMediaUploadImageResponseDto.fromData({
        bucketName,
        objectKey,
        publicUrl: buildPublicObjectPath(bucketName, objectKey),
        originalName: sanitizedOriginalName,
        mimeType: uploadMimeType,
        fileSize: uploadBuffer.length,
        width,
        height,
      }),
    )
  }
}
