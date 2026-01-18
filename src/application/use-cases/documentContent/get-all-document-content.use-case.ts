// src/application/use-cases/documentContent/get-all-document-content.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IDocumentContentRepository } from '../../../domain/repositories'
import { DocumentContentListQueryDto } from '../../dtos/documentContent/document-content-list-query.dto'
import { DocumentContentListResponseDto, DocumentContentResponseDto } from '../../dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class GetAllDocumentContentUseCase {
    constructor(
        @Inject('IDocumentContentRepository')
        private readonly documentContentRepository: IDocumentContentRepository,
    ) { }

    async execute(query: DocumentContentListQueryDto): Promise<DocumentContentListResponseDto> {
        const pagination = {
            page: query.page,
            limit: query.limit,
            sortBy: query.sortBy,
            sortOrder: query.sortOrder,
        }

        const filters = {
            learningItemId: query.learningItemId,
            search: query.search,
        }

        const result = await this.documentContentRepository.findAllWithPagination(pagination, filters)

        const documentContentDtos = result.documentContents.map((item) =>
            DocumentContentResponseDto.fromEntity(item),
        )

        return BaseResponseDto.success(
            'Document contents retrieved successfully',
            {
                documentContents: documentContentDtos,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            },
        )
    }
}
