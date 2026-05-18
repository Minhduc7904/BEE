import { Inject, Injectable } from '@nestjs/common'
import { PaginationResponseDto, TagListQueryDto, TagResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'

@Injectable()
export class GetTagsUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(query: TagListQueryDto): Promise<PaginationResponseDto<TagResponseDto>> {
    const pagination = query.toTagPaginationOptions()

    const result = await this.unitOfWork.executeInTransaction((repos) =>
      repos.tagRepository.findAllWithPagination({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder,
        search: query.search,
        type: query.type,
        isActive: query.isActive,
      }),
    )

    return PaginationResponseDto.success(
      'Lay danh sach tag thanh cong',
      TagResponseDto.fromEntityList(result.data),
      pagination.page,
      pagination.limit,
      result.total,
    )
  }
}
