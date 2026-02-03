// src/application/dtos/documentContent/update-document-content.dto.ts
import { IsOptionalString, IsOptionalInt } from 'src/shared/decorators/validate'

/**
 * DTO for updating document content
 * 
 * @description Used to update an existing document content item
 */
export class UpdateDocumentContentDto {
    /**
     * Document content
     * @optional
     * @example 'Updated document content...'
     */
    @IsOptionalString('Nội dung tài liệu')
    content?: string

    /**
     * Order in document
     * @optional
     * @example 2
     */
    @IsOptionalInt('Thứ tự trong tài liệu')
    orderInDocument?: number
}
