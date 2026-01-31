// src/application/use-cases/media/extract-media-text.use-case.ts
import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import type { IMediaRepository } from '../../../domain/repositories/media.repository'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { MistralService } from '../../../infrastructure/services/mistral.service'
import { FileConverterService } from '../../../infrastructure/services/file-converter.service'
import { MediaStatus, MediaType } from 'src/shared/enums'
import { BaseResponseDto } from '../../dtos'
import { MediaTextExtractionResponseDto } from '../../dtos/media'
import { EntityType } from 'src/shared/constants/entity-type.constants'

export interface OcrImageBase64 {
  id: string
  topLeftX: number
  topLeftY: number
  bottomRightX: number
  bottomRightY: number
  imageBase64: string
  imageAnnotation?: any
}

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

@Injectable()
export class ExtractMediaTextUseCase {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
    private readonly mistralService: MistralService,
    private readonly fileConverterService: FileConverterService,
  ) {}

  async execute(params: { mediaId: number; userId?: number; includeImageBase64?: boolean }) {
    const startTime = Date.now()
    const { mediaId, userId, includeImageBase64 = false } = params

    /* ------------------------------------------------------------------
     * 1. Validate media
     * ------------------------------------------------------------------ */
    const media = await this.mediaRepository.findById(mediaId)

    if (!media) throw new NotFoundException(`Media ${mediaId} not found`)
    if (media.status === MediaStatus.DELETED) throw new NotFoundException('Media has been deleted')
    if (media.status === MediaStatus.UPLOADING) throw new BadRequestException('Media is still uploading')
    if (media.status === MediaStatus.FAILED) throw new BadRequestException('Media upload failed')
    if (media.uploadedBy !== userId) throw new ForbiddenException('No permission to access this media')

    /* ------------------------------------------------------------------
     * 2. Validate type
     * ------------------------------------------------------------------ */
    if (![MediaType.IMAGE, MediaType.DOCUMENT].includes(media.type)) {
      throw new BadRequestException('Only IMAGE and DOCUMENT (PDF) are supported')
    }

    if (media.type === MediaType.DOCUMENT) {
      const isPdf = media.mimeType === 'application/pdf' || media.originalFilename?.toLowerCase().endsWith('.pdf')

      if (!isPdf) {
        throw new BadRequestException('Only PDF documents are supported')
      }
    }

    /* ------------------------------------------------------------------
     * 3. Download & convert
     * ------------------------------------------------------------------ */
    const fileBuffer = await this.minioService.downloadFile(media.bucketName, media.objectKey)

    const { base64 } = await this.fileConverterService.bufferToBase64(fileBuffer, media.mimeType)

    /* ------------------------------------------------------------------
     * 4. Detect file type
     * ------------------------------------------------------------------ */
    let fileType: 'pdf' | 'png' | 'jpg'

    if (media.type === MediaType.DOCUMENT) fileType = 'pdf'
    else if (media.mimeType.includes('png')) fileType = 'png'
    else if (media.mimeType.includes('jpeg') || media.mimeType.includes('jpg')) fileType = 'jpg'
    else if (media.mimeType.includes('webp')) fileType = 'png'
    else throw new BadRequestException('Unsupported image format')

    /* ------------------------------------------------------------------
     * 5. OCR
     * ------------------------------------------------------------------ */
    const ocrResult = await this.mistralService.performOcr(base64, fileType, {
      includeImageBase64,
    })

    /* ------------------------------------------------------------------
     * 6. Extract text & images
     * ------------------------------------------------------------------ */
    let extractedText = ''
    let pageCount: number | null = null
    let imagesBase64: OcrImageBase64[] = []

    if (Array.isArray(ocrResult.pages)) {
      pageCount = ocrResult.pages.length

      extractedText = ocrResult.pages
        .map((p: any) => p.markdown || p.text || '')
        .filter((t: string) => t.trim().length > 0)
        .join('\n\n---\n\n')

      if (includeImageBase64) {
        imagesBase64 = ocrResult.pages.flatMap((page: any) => {
          if (!Array.isArray(page.images)) return []

          return page.images
            .filter((img: any) => img.imageBase64)
            .map((img: any) => ({
              id: img.id,
              topLeftX: img.topLeftX,
              topLeftY: img.topLeftY,
              bottomRightX: img.bottomRightX,
              bottomRightY: img.bottomRightY,
              imageBase64: img.imageBase64,
              imageAnnotation: img.imageAnnotation ?? null,
            }))
        })
      }
    } else if (ocrResult.text) {
      extractedText = ocrResult.text
    }

    /* ------------------------------------------------------------------
     * 7. Detach OLD OCR child media usages & soft delete if unused
     * (chỉ xử lý media OCR cũ, không đụng media mới)
     * ------------------------------------------------------------------ */
    const existingChildren = await this.mediaRepository.findByParentId(mediaId)

    const oldChildren = existingChildren.filter((child) => child.createdAt.getTime() < startTime)

    await Promise.all(
      oldChildren.map(async (child) => {
        try {
          const usages = await this.mediaUsageRepository.findByMedia(child.mediaId)

          const parentUsage = usages.find((u) => u.entityType === EntityType.MEDIA && u.entityId === mediaId)

          if (parentUsage) {
            await this.mediaUsageRepository.detach(parentUsage.usageId)
          }

          const remainingUsages = usages.filter((u) => u.usageId !== parentUsage?.usageId)

          if (remainingUsages.length === 0) {
            await this.mediaRepository.softDelete(child.mediaId)
          }
        } catch (err) {
          console.error(`Failed to detach/delete OCR child media ${child.mediaId}`, err)
        }
      }),
    )

    /* ------------------------------------------------------------------
     * 8. Save OCR images → MinIO + Media
     * ------------------------------------------------------------------ */
    const imageIdToMediaId = new Map<string, number>()

    await Promise.all(
      imagesBase64.map(async (image) => {
        try {
          if (!image.imageBase64.includes(',')) return

          const [, base64Data] = image.imageBase64.split(',')
          if (!base64Data) return

          const imageBuffer = Buffer.from(base64Data, 'base64')

          const match = image.imageBase64.match(/^data:(image\/\w+);base64,/)
          const mimeType = match?.[1] ?? 'image/png'
          const ext = mimeType.split('/')[1]

          const fileName = `${image.id}-${Date.now()}.${ext}`
          const objectKey = `extracted-images/${mediaId}/${fileName}`

          await this.minioService.uploadFile(media.bucketName, objectKey, imageBuffer, { 'Content-Type': mimeType })

          const imageMedia = await this.mediaRepository.create({
            bucketName: media.bucketName,
            objectKey,
            originalFilename: image.id,
            mimeType,
            fileSize: imageBuffer.length,
            type: MediaType.IMAGE,
            status: MediaStatus.READY,
            uploadedBy: media.uploadedBy,
            parentId: mediaId,
          })

          await this.mediaUsageRepository.attach({
            mediaId: imageMedia.mediaId,
            entityType: EntityType.MEDIA,
            entityId: mediaId,
          })

          imageIdToMediaId.set(image.id, imageMedia.mediaId)
        } catch (err) {
          console.error(`Failed to save OCR image ${image.id}`, err)
        }
      }),
    )

    /* ------------------------------------------------------------------
     * 9. Normalize markdown image refs
     * ![anything](img-id) → ![media:123](media:123)
     * ------------------------------------------------------------------ */
    let processedRawContent = extractedText

    imageIdToMediaId.forEach((newMediaId, originalImageId) => {
      const escapedId = escapeRegExp(originalImageId)

      const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapedId}\\)`, 'g')

      processedRawContent = processedRawContent.replace(pattern, `![media:${newMediaId}](media:${newMediaId})`)
    })

    /* ------------------------------------------------------------------
     * 10. Save rawContent
     * ------------------------------------------------------------------ */
    await this.mediaRepository.update(mediaId, {
      rawContent: processedRawContent,
    })

    /* ------------------------------------------------------------------
     * 11. Response
     * ------------------------------------------------------------------ */
    const processingTime = Date.now() - startTime

    const response: MediaTextExtractionResponseDto = {
      mediaId: media.mediaId,
      text: processedRawContent,
      filename: media.originalFilename,
      mimeType: media.mimeType,
      type: media.type,
      fileSize: media.fileSize,
      pages: pageCount,
      ...(includeImageBase64 && { imagesBase64 }),
      metadata: {
        model: ocrResult.model || 'mistral-ocr-latest',
        processingTime,
        pagesProcessed: ocrResult.usageInfo?.pagesProcessed || pageCount,
        docSizeBytes: ocrResult.usageInfo?.docSizeBytes,
        savedImages: imageIdToMediaId.size,
        ...(ocrResult.metadata && {
          ocrMetadata: ocrResult.metadata,
        }),
      },
    }

    return BaseResponseDto.success('Text extracted successfully', response)
  }
}
