import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, DocumentMediaUsageResponseDto, DocumentResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { DOCUMENT_MEDIA_FIELDS } from 'src/shared/constants'
import { MediaStatus } from 'src/shared/enums'
import { MinioService } from 'src/application/interfaces'

const DOCUMENT_MEDIA_URL_EXPIRY_SECONDS = 3600 * 24

@Injectable()
export class GetDocumentBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(slug: string): Promise<BaseResponseDto<DocumentResponseDto>> {
    const document = await this.unitOfWork.executeInTransaction((repos) =>
      repos.documentRepository.findBySlug(slug, true),
    )

    if (!document) {
      throw new NotFoundException('Khong tim thay tai lieu')
    }

    const response = DocumentResponseDto.fromEntity(document)
    await this.attachUsageUrls(response)
    return BaseResponseDto.success('Lay tai lieu thanh cong', response)
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
