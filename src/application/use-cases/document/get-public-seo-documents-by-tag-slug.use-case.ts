import { Inject, Injectable } from '@nestjs/common'
import { DocumentListQueryDto, DocumentResponseDto, PaginationResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { Visibility } from 'src/shared/enums'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { GetDocumentsUseCase } from './get-documents.use-case'

@Injectable()
export class GetPublicSeoDocumentsByTagSlugUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
  ) {}

  async execute(
    slug: string,
    query: DocumentListQueryDto,
  ): Promise<PaginationResponseDto<DocumentResponseDto>> {
    const tag = await this.unitOfWork.executeInTransaction((repos) =>
      repos.tagRepository.findBySlug(slug),
    )

    if (!tag) {
      throw new NotFoundException('Khong tim thay tag')
    }

    query.visibility = Visibility.PUBLISHED
    query.tagId = tag.tagId
    query.tagIds = undefined

    return this.getDocumentsUseCase.execute(query)
  }
}
