import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, DocumentMediaUsageResponseDto, DocumentResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { DOCUMENT_MEDIA_FIELDS } from 'src/shared/constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus, Visibility } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { type ContentField } from '../media/process-content-with-presigned-urls.use-case'
import { ProcessContentWithPresignedUrlsAndRenderHtmlUseCase } from '../media/process-content-with-presigned-urls-and-render-html.use-case'

const DOCUMENT_MEDIA_URL_EXPIRY_SECONDS = 3600 * 24

@Injectable()
export class GetPublicSeoDocumentBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
    private readonly processContentAndRenderHtmlUseCase: ProcessContentWithPresignedUrlsAndRenderHtmlUseCase,
  ) {}

  async execute(slug: string): Promise<BaseResponseDto<DocumentResponseDto>> {
    const document = await this.unitOfWork.executeInTransaction((repos) =>
      repos.documentRepository.findBySlug(slug, true),
    )

    if (!document || document.visibility !== Visibility.PUBLISHED) {
      throw new NotFoundException('Khong tim thay tai lieu')
    }

    const response = DocumentResponseDto.fromEntity(document)
    await this.attachUsageUrls(response)
    await this.attachProcessedContent(response)
    return BaseResponseDto.success('Lay tai lieu thanh cong', response)
  }

  private async attachProcessedContent(response: DocumentResponseDto): Promise<void> {
    if (!response.content) {
      response.processedContent = response.content
      return
    }

    const contentFields: ContentField[] = [
      { fieldName: DOCUMENT_MEDIA_FIELDS.CONTENT, content: response.content },
    ]
    const processedResults = await this.processContentAndRenderHtmlUseCase.execute(
      contentFields,
      DOCUMENT_MEDIA_URL_EXPIRY_SECONDS,
    )

    response.processedContent =
      this.processContentAndRenderHtmlUseCase.getProcessedContent(
        processedResults,
        DOCUMENT_MEDIA_FIELDS.CONTENT,
      ) || response.content
  }

  private async attachUsageUrls(response: DocumentResponseDto): Promise<void> {
    const usages = await this.unitOfWork.executeInTransaction((repos) =>
      repos.mediaUsageRepository.findByEntity(EntityType.DOCUMENT, response.documentId),
    )

    response.mediaUsages = await Promise.all(
      usages.map(async (usage) => {
        const media = usage.media
        let url: string | null = null

        if (media && media.status === MediaStatus.READY) {
          try {
            url =
              media.publicUrl ||
              (await this.minioService.getPresignedUrl(
                media.bucketName,
                media.objectKey,
                DOCUMENT_MEDIA_URL_EXPIRY_SECONDS,
              ))
          } catch {
            url = null
          }
        }

        if (usage.fieldName === DOCUMENT_MEDIA_FIELDS.DOCUMENT_THUMBNAIL) {
          response.thumbnailUrl = url
        }

        return DocumentMediaUsageResponseDto.fromData({
          usageId: usage.usageId,
          mediaId: usage.mediaId,
          fieldName: usage.fieldName,
          url,
          mimeType: media?.mimeType ?? null,
          originalFilename: media?.originalFilename ?? null,
        })
      }),
    )
  }
}
