// src/application/dtos/documentContent/create-document-content.dto.ts
import { IsRequiredIdNumber, IsRequiredString, IsOptionalIntArray } from 'src/shared/decorators/validate'

/**
 * DTO for creating document content
 * 
 * @description Used to create a new document content item for a learning item
 * @note orderInDocument will be automatically set to max(orderInDocument) + 1
 */
export class CreateDocumentContentDto {
    /**
     * Learning item ID
     * @required
     * @example 1
     */
    @IsRequiredIdNumber('ID mục học')
    learningItemId: number

    /**
     * Document content
     * @required
     * @example 'This is the document content...'
     */
    @IsRequiredString('Nội dung tài liệu')
    content: string

    /**
     * Media IDs for document files
     * @optional
     * @example [123, 456]
     */
    @IsOptionalIntArray('Danh sách ID media')
    mediaIds?: number[]
}
