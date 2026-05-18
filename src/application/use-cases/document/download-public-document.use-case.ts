import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { DOCUMENT_MEDIA_FIELDS } from 'src/shared/constants'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { MediaStatus, Visibility } from 'src/shared/enums'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'

const DOCUMENT_DOWNLOAD_URL_EXPIRY_SECONDS = 300

@Injectable()
export class DownloadPublicDocumentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(slug: string): Promise<{ downloadUrl: string }> {
    const { media } = await this.unitOfWork.executeInTransaction(async (repos) => {
      const document = await repos.documentRepository.findBySlug(slug)
      if (!document || document.visibility !== Visibility.PUBLISHED) {
        throw new NotFoundException('Khong tim thay tai lieu')
      }

      const usages = await repos.mediaUsageRepository.findByEntity(
        EntityType.DOCUMENT,
        document.documentId,
        DOCUMENT_MEDIA_FIELDS.DOCUMENT_FILE,
      )
      const media = usages[0]?.media
      if (!media) {
        throw new NotFoundException('Khong tim thay file tai lieu')
      }

      if (media.status !== MediaStatus.READY) {
        throw new ConflictException('File tai lieu chua san sang de tai')
      }

      await repos.documentRepository.incrementDownloadCount(document.documentId)
      return { media }
    })

    return {
      downloadUrl: await this.minioService.getPresignedDownloadUrl(
        media.bucketName,
        media.objectKey,
        DOCUMENT_DOWNLOAD_URL_EXPIRY_SECONDS,
        media.originalFilename,
      ),
    }
  }
}
