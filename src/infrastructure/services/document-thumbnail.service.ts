import { Injectable } from '@nestjs/common'
import { createCanvas } from 'canvas'
import { join } from 'path'
import sharp from 'sharp'
import { MediaEntity } from 'src/domain/entities'
import { generateObjectKey, sanitizeFilename } from 'src/shared/utils'
import { MinioService } from './minio.service'

export interface GeneratedDocumentThumbnail {
  buffer: Buffer
  bucketName: string
  objectKey: string
  originalFilename: string
  mimeType: string
  width: number | null
  height: number | null
}

@Injectable()
export class DocumentThumbnailService {
  constructor(private readonly minioService: MinioService) {}

  async generateFromPdf(media: MediaEntity): Promise<GeneratedDocumentThumbnail> {
    const pdfBuffer = await this.minioService.downloadFile(media.bucketName, media.objectKey)
    const firstPagePng = await this.renderFirstPageToPng(pdfBuffer)

    const image = sharp(firstPagePng).resize({
      width: 1200,
      height: 1600,
      fit: 'inside',
      withoutEnlargement: true,
    })

    const buffer = await image.webp({ quality: 82 }).toBuffer()
    const metadata = await sharp(buffer).metadata()
    const originalFilename = sanitizeFilename(`${media.originalFilename}-thumbnail.webp`, {
      fallbackName: 'document-thumbnail.webp',
      overrideExtension: '.webp',
    })
    const objectKey = generateObjectKey(`document-thumbnails/${media.mediaId}`, originalFilename)

    return {
      buffer,
      bucketName: this.minioService.getBuckets().images,
      objectKey,
      originalFilename,
      mimeType: 'image/webp',
      width: metadata.width ?? null,
      height: metadata.height ?? null,
    }
  }

  private async renderFirstPageToPng(pdfBuffer: Buffer): Promise<Buffer> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      standardFontDataUrl: `${join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts')}/`,
    })
    const pdf = await loadingTask.promise

    try {
      const page = await pdf.getPage(1)
      const baseViewport = page.getViewport({ scale: 1 })
      const scale = Math.min(2, 1200 / baseViewport.width, 1600 / baseViewport.height)
      const viewport = page.getViewport({ scale })
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
      const context = canvas.getContext('2d')

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({
        canvasContext: context as any,
        viewport,
      }).promise

      return canvas.toBuffer('image/png')
    } finally {
      await pdf.destroy()
    }
  }

  async upload(thumbnail: GeneratedDocumentThumbnail): Promise<void> {
    await this.minioService.uploadFile(
      thumbnail.bucketName,
      thumbnail.objectKey,
      thumbnail.buffer,
      { 'Content-Type': thumbnail.mimeType },
    )
  }
}
