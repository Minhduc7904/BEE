// src/application/use-cases/documentContent/get-document-content-by-id.use-case.ts
import { Injectable, Inject } from '@nestjs/common'
import type { IDocumentContentRepository } from '../../../domain/repositories'
import { DocumentContentResponseDto } from '../../dtos/documentContent/document-content.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetDocumentContentByIdUseCase {
    constructor(
        @Inject('IDocumentContentRepository')
        private readonly documentContentRepository: IDocumentContentRepository,
    ) { }

    async execute(id: number): Promise<BaseResponseDto<DocumentContentResponseDto>> {
        const documentContent = await this.documentContentRepository.findById(id)

        if (!documentContent) {
            throw new NotFoundException(`Document content with ID ${id} not found`)
        }

        const dto = DocumentContentResponseDto.fromEntity(documentContent)
        return BaseResponseDto.success('Document content retrieved successfully', dto)
    }
}
