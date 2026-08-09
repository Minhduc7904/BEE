import { BookMediaResponseDto, BookResponseDto } from 'src/application/dtos'
import type { IUnitOfWork, UnitOfWorkRepos } from 'src/domain/repositories'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { BOOK_MEDIA_FIELDS } from 'src/shared/constants/media-field-name.constants'
import { MediaStatus, MediaVisibility } from 'src/shared/enums'
import { BusinessLogicException } from 'src/shared/exceptions/custom-exceptions'
import { MinioService } from 'src/application/interfaces'

export async function syncBookMedia(
  repos: UnitOfWorkRepos,
  bookId: number,
  data: { coverMediaId?: number | null; ogImageMediaId?: number | null; galleryMediaIds?: number[] },
  userId: number,
): Promise<void> {
  const entries: Array<{ fieldName: string; mediaIds: number[] }> = []
  if (data.coverMediaId !== undefined)
    entries.push({ fieldName: BOOK_MEDIA_FIELDS.COVER, mediaIds: data.coverMediaId ? [data.coverMediaId] : [] })
  if (data.ogImageMediaId !== undefined)
    entries.push({ fieldName: BOOK_MEDIA_FIELDS.OG_IMAGE, mediaIds: data.ogImageMediaId ? [data.ogImageMediaId] : [] })
  if (data.galleryMediaIds !== undefined)
    entries.push({ fieldName: BOOK_MEDIA_FIELDS.GALLERY, mediaIds: data.galleryMediaIds })

  for (const entry of entries) {
    if (new Set(entry.mediaIds).size !== entry.mediaIds.length) {
      throw new BusinessLogicException('Danh sách media không được chứa ID trùng lặp')
    }
    const mediaFiles = await repos.mediaRepository.findByIds(entry.mediaIds)
    if (mediaFiles.length !== entry.mediaIds.length || mediaFiles.some((media) => media.status !== MediaStatus.READY)) {
      throw new BusinessLogicException('Media phải tồn tại và ở trạng thái sẵn sàng')
    }
    await repos.mediaUsageRepository.detachByEntity(EntityType.BOOK, bookId, entry.fieldName)
    for (const mediaId of entry.mediaIds) {
      await repos.mediaUsageRepository.attach({
        mediaId,
        entityType: EntityType.BOOK,
        entityId: bookId,
        fieldName: entry.fieldName,
        usedBy: userId,
        visibility: MediaVisibility.PUBLIC,
      })
    }
  }
}

export async function attachBookMedia(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  response: BookResponseDto,
): Promise<void> {
  await attachBookMediaToResponses(unitOfWork, minioService, [response])
}

export async function attachBookMediaToResponses(
  unitOfWork: IUnitOfWork,
  minioService: MinioService,
  responses: BookResponseDto[],
): Promise<void> {
  const bookIds = responses.map((response) => response.bookId)
  if (!bookIds.length) {
    return
  }

  const usages = await unitOfWork.executeInTransaction((repos) =>
    repos.mediaUsageRepository.findByEntities(EntityType.BOOK, bookIds),
  )
  const mediaByBookId = new Map<number, BookMediaResponseDto[]>()

  for (const usage of usages) {
    if (!usage.media || usage.media.status !== MediaStatus.READY) {
      continue
    }

    const media = await BookMediaResponseDto.fromUsage(usage, minioService)
    if (!media) {
      continue
    }

    const items = mediaByBookId.get(usage.entityId) ?? []
    items.push(media)
    mediaByBookId.set(usage.entityId, items)
  }

  for (const response of responses) {
    response.media = mediaByBookId.get(response.bookId) ?? []
  }
}
