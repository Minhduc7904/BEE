import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, DocumentResponseDto, UpdateDocumentDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { ConflictException, NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { MediaStatus, MediaType, MediaVisibility } from 'src/shared/enums'
import { DOCUMENT_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { AttachMediaFromContentUseCase } from '../media/attach-media-from-content.use-case'
import { generateUniqueDocumentSlug } from './document-slug.util'
import { assertTagIdsExist } from './document-tags.util'

@Injectable()
export class UpdateDocumentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly attachMediaFromContentUseCase: AttachMediaFromContentUseCase,
  ) {}

  async execute(
    documentId: number,
    dto: UpdateDocumentDto,
    userId?: number,
  ): Promise<BaseResponseDto<DocumentResponseDto>> {
    const document = await this.unitOfWork.executeInTransaction(async (repos) => {
      const existing = await repos.documentRepository.findById(documentId)
      if (!existing) {
        throw new NotFoundException('Khong tim thay tai lieu')
      }

      const { thumbnailMediaId, ...updateData } = dto

      if (dto.content !== undefined) {
        const normalizedResults = this.attachMediaFromContentUseCase.normalizeAndExtract([
          { fieldName: DOCUMENT_MEDIA_FIELDS.CONTENT, content: dto.content },
        ])

        const normalizedContent = this.attachMediaFromContentUseCase.getNormalizedContent(
          normalizedResults,
          DOCUMENT_MEDIA_FIELDS.CONTENT,
        ) || ''

        updateData.content = normalizedContent

        await this.attachMediaFromContentUseCase.syncMediaOnUpdate(
          existing.content,
          normalizedContent,
          EntityType.DOCUMENT,
          documentId,
          userId!,
          repos.mediaUsageRepository,
          DOCUMENT_MEDIA_FIELDS.CONTENT,
        )
      }

      if (dto.title && dto.title !== existing.title) {
        updateData.slug = await generateUniqueDocumentSlug(
          dto.title,
          repos.documentRepository,
          existing.documentId,
          existing.slug,
        )
      }

      if (!updateData.slug && dto.slug && dto.slug !== existing.slug) {
        const duplicated = await repos.documentRepository.findBySlug(dto.slug)
        if (duplicated && duplicated.documentId !== documentId) {
          throw new ConflictException(`Slug '${dto.slug}' da ton tai`)
        }
      }

      if (thumbnailMediaId !== undefined) {
        const newThumbnail = await repos.mediaRepository.findById(thumbnailMediaId)
        if (!newThumbnail) {
          throw new NotFoundException(`Khong tim thay thumbnail media ${thumbnailMediaId}`)
        }

        if (newThumbnail.status !== MediaStatus.READY || newThumbnail.type !== MediaType.IMAGE) {
          throw new ConflictException('Thumbnail media khong hop le')
        }

        const currentThumbnailUsage = await repos.mediaUsageRepository.findOnlyByContext({
          entityType: EntityType.DOCUMENT,
          entityId: documentId,
          fieldName: DOCUMENT_MEDIA_FIELDS.DOCUMENT_THUMBNAIL,
        })

        if (currentThumbnailUsage?.mediaId !== thumbnailMediaId) {
          if (currentThumbnailUsage) {
            await repos.mediaUsageRepository.detach(currentThumbnailUsage.usageId)

            const remainingUsages = await repos.mediaUsageRepository.findByMedia(currentThumbnailUsage.mediaId)
            if (remainingUsages.length === 0) {
              await repos.mediaRepository.softDelete(currentThumbnailUsage.mediaId)
            }
          }

          await repos.mediaUsageRepository.attach({
            mediaId: thumbnailMediaId,
            entityType: EntityType.DOCUMENT,
            entityId: documentId,
            fieldName: DOCUMENT_MEDIA_FIELDS.DOCUMENT_THUMBNAIL,
            usedBy: userId,
            visibility: MediaVisibility.PUBLIC,
          })
        }
      }

      await assertTagIdsExist(repos, dto.tagIds)

      return repos.documentRepository.update(documentId, {
        ...updateData,
        updatedBy: userId ?? null,
      })
    })

    return BaseResponseDto.success(
      'Cap nhat tai lieu thanh cong',
      DocumentResponseDto.fromEntity(document),
    )
  }
}
