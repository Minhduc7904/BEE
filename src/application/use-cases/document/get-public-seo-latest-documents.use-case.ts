import { Injectable } from '@nestjs/common'
import { DocumentListQueryDto, DocumentResponseDto, PaginationResponseDto } from 'src/application/dtos'
import { Visibility } from 'src/shared/enums'
import { SortOrder } from 'src/shared/enums/sort-order.enum'
import { GetDocumentsUseCase } from './get-documents.use-case'

@Injectable()
export class GetPublicSeoLatestDocumentsUseCase {
  constructor(
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
  ) {}

  async execute(limit = 4): Promise<PaginationResponseDto<DocumentResponseDto>> {
    const query = Object.assign(new DocumentListQueryDto(), {
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: SortOrder.DESC,
      visibility: Visibility.PUBLISHED,
      includeTags: true,
    })

    const response = await this.getDocumentsUseCase.execute(query)
    const latestItems = (response.data || []).slice(0, limit)

    return PaginationResponseDto.success(
      'Lay danh sach tai lieu moi nhat thanh cong',
      latestItems,
      1,
      limit,
      latestItems.length,
    )
  }
}
