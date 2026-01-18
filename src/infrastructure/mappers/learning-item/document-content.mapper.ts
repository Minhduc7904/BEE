// src/infrastructure/mappers/document-content.mapper.ts
import { DocumentContent } from '../../../domain/entities'
import { LearningItemMapper } from './learning-item.mapper'

/**
 * Mapper class để convert từ Prisma DocumentContent model
 * sang Domain DocumentContent entity
 */
export class DocumentContentMapper {
    /**
     * Convert Prisma DocumentContent model sang Domain DocumentContent entity
     */
    static toDomainDocumentContent(prismaDocumentContent: any): DocumentContent | undefined {
        if (!prismaDocumentContent) return undefined

        return new DocumentContent({
            documentContentId: prismaDocumentContent.documentContentId,
            learningItemId: prismaDocumentContent.learningItemId,
            content: prismaDocumentContent.content,
            orderInDocument: prismaDocumentContent.orderInDocument ?? undefined,
            createdAt: prismaDocumentContent.createdAt,
            updatedAt: prismaDocumentContent.updatedAt,

            // Relations
            learningItem: prismaDocumentContent.learningItem
                ? LearningItemMapper.toDomainLearningItem(prismaDocumentContent.learningItem)
                : undefined,
        })
    }

    /**
     * Convert array Prisma DocumentContents sang array Domain DocumentContents
     */
    static toDomainDocumentContents(prismaDocumentContents: any[]): DocumentContent[] {
        return prismaDocumentContents
            .map((item) => this.toDomainDocumentContent(item))
            .filter(Boolean) as DocumentContent[]
    }
}
