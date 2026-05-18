import { Inject, Injectable } from '@nestjs/common'
import { PaginationResponseDto, TagListQueryDto, TagResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { TextSearchUtil } from 'src/shared/utils/text-search.util'

@Injectable()
export class SearchPublicSeoTagsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: TagListQueryDto): Promise<PaginationResponseDto<TagResponseDto>> {
    const pagination = query.toTagPaginationOptions()
    const normalizedSearch = this.normalizeSearch(query.search)

    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.tagRepository.findAllWithPagination({
        skip: 0,
        take: 1000,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        type: query.type,
        isActive: true,
      }),
    )

    const filteredTags = normalizedSearch
      ? result.data.filter((tag) =>
          [tag.name, tag.slug, tag.description]
            .filter((value): value is string => Boolean(value))
            .some((value) => this.normalizeSearch(value).includes(normalizedSearch)),
        )
      : result.data

    const start = (pagination.page - 1) * pagination.limit
    const paginatedTags = filteredTags.slice(start, start + pagination.limit)

    return PaginationResponseDto.success(
      'Tim kiem tag public thanh cong',
      TagResponseDto.fromEntityList(paginatedTags),
      pagination.page,
      pagination.limit,
      filteredTags.length,
    )
  }

  private normalizeSearch(value?: string | null): string {
    return TextSearchUtil.removeVietnameseAccents((value || '').trim()).toLowerCase()
  }
}
