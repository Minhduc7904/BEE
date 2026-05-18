import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { PDFDocument } from 'pdf-lib'
import type { IMediaRepository, IMediaUsageRepository } from 'src/domain/repositories'
import { MediaEntity } from 'src/domain/entities'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus, MediaType } from 'src/shared/enums'
import { detectMediaType, generateObjectKey, sanitizeFilename } from 'src/shared/utils'
import { FileConverterService } from './file-converter.service'
import { MarkdownFixService } from './markdown-fix.service'
import { MinioService } from './minio.service'
import { MistralService } from './mistral.service'

interface OcrImageBase64 {
  id: string
  imageBase64: string
  alt?: string
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

@Injectable()
export class DocumentContentExtractionService {
  constructor(
    @Inject('IMediaRepository')
    private readonly mediaRepository: IMediaRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
    private readonly mistralService: MistralService,
    private readonly fileConverterService: FileConverterService,
    private readonly markdownFixService: MarkdownFixService,
  ) {}

  async extractMarkdownFromPageRange(
    media: MediaEntity,
    startPage: number,
    endPage: number,
  ): Promise<string> {
    const selectedPdfBuffer = await this.extractPdfRange(media, startPage, endPage)
    const { base64 } = await this.fileConverterService.bufferToBase64(selectedPdfBuffer, 'application/pdf')
    const ocrResult = await this.mistralService.performOcr(base64, 'pdf', {
      includeImageBase64: true,
    })

    const extractedText = Array.isArray(ocrResult.pages)
      ? ocrResult.pages
          .map((page: any) => page.markdown || page.text || '')
          .filter((text: string) => text.trim().length > 0)
          .join('\n\n---\n\n')
      : ocrResult.text || ''

    const images = Array.isArray(ocrResult.pages)
      ? ocrResult.pages.flatMap((page: any) =>
          Array.isArray(page.images)
            ? page.images
                .filter((image: any) => image.imageBase64)
                .map((image: any) => ({
                  id: image.id,
                  imageBase64: image.imageBase64,
                  alt: this.extractImageAlt(extractedText, image.id),
                }))
            : [],
        )
      : []

    const imageIdToMediaId = await this.persistOcrImages(media, images)
    let markdown = extractedText

    imageIdToMediaId.forEach((mediaId, originalImageId) => {
      const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegExp(originalImageId)}\\)`, 'g')
      markdown = markdown.replace(pattern, `![media:${mediaId}](media:${mediaId})`)
    })

    if (!markdown.trim()) {
      return markdown
    }

    const fixed = await this.markdownFixService.fixMarkdown(markdown)
    return fixed.fixedContent
  }

  private async extractPdfRange(media: MediaEntity, startPage: number, endPage: number): Promise<Buffer> {
    if (startPage > endPage) {
      throw new BadRequestException('Trang bat dau khong duoc lon hon trang ket thuc')
    }

    const sourceBuffer = await this.minioService.downloadFile(media.bucketName, media.objectKey)
    const sourcePdf = await PDFDocument.load(sourceBuffer)
    const pageCount = sourcePdf.getPageCount()

    if (startPage < 1 || endPage > pageCount) {
      throw new BadRequestException(`Khoang trang phai nam trong 1-${pageCount}`)
    }

    const outputPdf = await PDFDocument.create()
    const pageIndexes = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage - 1 + index)
    const pages = await outputPdf.copyPages(sourcePdf, pageIndexes)
    pages.forEach((page) => outputPdf.addPage(page))

    return Buffer.from(await outputPdf.save())
  }

  private async persistOcrImages(
    media: MediaEntity,
    images: OcrImageBase64[],
  ): Promise<Map<string, number>> {
    const imageIdToMediaId = new Map<string, number>()

    await Promise.all(
      images.map(async (image) => {
        if (!image.imageBase64.includes(',')) return

        const [, base64Data] = image.imageBase64.split(',')
        if (!base64Data) return

        const imageBuffer = Buffer.from(base64Data, 'base64')
        const match = image.imageBase64.match(/^data:(image\/\w+);base64,/)
        const mimeType = match?.[1] ?? 'image/png'
        const mediaType = detectMediaType(mimeType)

        if (mediaType !== MediaType.IMAGE) {
          return
        }

        const extension = mimeType.split('/')[1]
        const originalFilename = sanitizeFilename(`${image.id}.${extension}`, {
          fallbackName: 'ocr_image',
        })
        const bucketName = this.minioService.getBuckets().images
        const objectKey = generateObjectKey(`document-content-images/${media.mediaId}`, originalFilename)

        await this.minioService.uploadFile(bucketName, objectKey, imageBuffer, {
          'Content-Type': mimeType,
        })

        const imageMedia = await this.mediaRepository.create({
          bucketName,
          objectKey,
          originalFilename,
          mimeType,
          fileSize: imageBuffer.length,
          type: MediaType.IMAGE,
          status: MediaStatus.READY,
          uploadedBy: media.uploadedBy,
          parentId: media.mediaId,
          alt: image.alt?.slice(0, 255),
        })

        await this.mediaUsageRepository.attach({
          mediaId: imageMedia.mediaId,
          entityType: EntityType.MEDIA,
          entityId: media.mediaId,
        })

        imageIdToMediaId.set(image.id, imageMedia.mediaId)
      }),
    )

    return imageIdToMediaId
  }

  private extractImageAlt(markdown: string, imageId: string): string | undefined {
    const pattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escapeRegExp(imageId)}\\)`)
    const match = markdown.match(pattern)
    const alt = match?.[1]?.trim()
    return alt || undefined
  }

}
