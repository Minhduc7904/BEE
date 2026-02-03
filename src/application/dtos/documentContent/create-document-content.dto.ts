// src/application/dtos/documentContent/create-document-content.dto.ts
import { IsRequiredIdNumber, IsRequiredString, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO for creating document content
 * 
 * @description Used to create a new document content item for a learning item
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
     * Order in document
     * @optional
     * @example 1
     */
    @IsOptionalInt('Thứ tự trong tài liệu')
    orderInDocument?: number
}
