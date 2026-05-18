import { Inject, Injectable } from '@nestjs/common'
import { DocumentListQueryDto, DocumentResponseDto, PaginationResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { GetDocumentsUseCase } from './get-documents.use-case'

@Injectable()
export class GetPublicSeoRelatedDocumentsBySlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
  ) { }

  async execute(slug: string, limit = 10): Promise<PaginationResponseDto<DocumentResponseDto>> {
    const document = await this.unitOfWork.executeInTransaction((repos) =>
      repos.documentRepository.findBySlug(slug, true),
    )

    if (!document || document.visibility !== Visibility.PUBLISHED) {
      throw new NotFoundException('Khong tim thay tai lieu')
    }

    const tagIds =
      document.tags
        ?.map((documentTag) => documentTag.tagId)
        .filter((tagId): tagId is number => Number.isInteger(tagId)) ?? []

    const query = Object.assign(new DocumentListQueryDto(), {
      page: 1,
      limit: Math.max(limit * 2, 20),
      sortBy: 'createdAt',
      sortOrder: SortOrder.DESC,
      visibility: Visibility.PUBLISHED,
      tagIds: tagIds.length ? tagIds : undefined,
      includeTags: true,
    })

    const response = await this.getDocumentsUseCase.execute(query)
    const relatedItems = (response.data || [])
      .filter((item) => item.documentId !== document.documentId)
      .slice(0, limit)

    return PaginationResponseDto.success(
      'Lay danh sach tai lieu lien quan thanh cong',
      relatedItems,
      1,
      limit,
      relatedItems.length,
    )
  }
}
