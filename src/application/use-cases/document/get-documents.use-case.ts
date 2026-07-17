import { Inject, Injectable } from '@nestjs/common'
import { DocumentListQueryDto, DocumentResponseDto, PaginationResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { DOCUMENT_MEDIA_FIELDS } from 'src/shared/constants'
import { MediaStatus } from 'src/shared/enums'
import { MinioService } from 'src/application/interfaces'

const DOCUMENT_MEDIA_URL_EXPIRY_SECONDS = 3600 * 24

@Injectable()
export class GetDocumentsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly minioService: MinioService,
  ) {}

  async execute(
    query: DocumentListQueryDto,
    options?: { requiredTagId?: number },
  ): Promise<PaginationResponseDto<DocumentResponseDto>> {
    const pagination = query.toDocumentPaginationOptions()

    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.documentRepository.findAllWithPagination({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        search: query.search,
        visibility: query.visibility,
        isFeatured: query.isFeatured,
        requiredTagId: options?.requiredTagId,
        tagId: query.tagId,
        tagIds: query.tagIds?.length ? query.tagIds : query.tagId ? [query.tagId] : undefined,
        tagSlugs: query.tagSlugs?.length ? query.tagSlugs : undefined,
        includeTags: query.includeTags,
      }),
    )

    const items = DocumentResponseDto.fromEntityList(result.data)

    if (items.length > 0) {
      const usages = await this.unitOfWork.executeInTransaction((repos) =>
        repos.mediaUsageRepository.findByEntities(
          EntityType.DOCUMENT,
          items.map((item) => item.documentId),
          DOCUMENT_MEDIA_FIELDS.DOCUMENT_THUMBNAIL,
        ),
      )

      const usageMap = new Map<number, typeof usages[number]>()
      for (const usage of usages) {
        if (!usageMap.has(usage.entityId)) {
          usageMap.set(usage.entityId, usage)
        }
      }

      for (const item of items) {
        const media = usageMap.get(item.documentId)?.media
        if (!media || media.status !== MediaStatus.READY) continue

        try {
          item.thumbnailUrl =
            media.publicUrl ||
            (await this.minioService.getPresignedUrl(
              media.bucketName,
              media.objectKey,
              DOCUMENT_MEDIA_URL_EXPIRY_SECONDS,
            ))
        } catch {
          item.thumbnailUrl = null
        }
      }
    }

    return PaginationResponseDto.success(
      'Lay danh sach tai lieu thanh cong',
      items,
      pagination.page,
      pagination.limit,
      result.total,
    )
  }
}
