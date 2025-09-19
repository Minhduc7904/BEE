// src/infrastructure/mappers/document.mapper.ts
import { Document } from '../../domain/entities/document/document.entity'
import { AdminMapper } from './admin.mapper'

/**
 * Mapper class để convert từ Prisma Document models sang Domain Document entities
 */
export class DocumentMapper {
  static toDomainDocument(prismaDocument: any): Document | null {
    if (!prismaDocument) return null

    return new Document({
      documentId: prismaDocument.documentId,
      adminId: prismaDocument.adminId ?? undefined,
      description: prismaDocument.description ?? undefined,
      url: prismaDocument.url,
      anotherUrl: prismaDocument.anotherUrl ?? undefined,
      mimeType: prismaDocument.mimeType ?? undefined,
      subjectId: prismaDocument.subjectId ?? undefined,
      relatedType: prismaDocument.relatedType ?? undefined,
      relatedId: prismaDocument.relatedId ?? undefined,
      storageProvider: prismaDocument.storageProvider,
      createdAt: prismaDocument.createdAt,
      updatedAt: prismaDocument.updatedAt,
      subject: prismaDocument.subject || undefined,
      admin: prismaDocument.admin ? AdminMapper.toDomainAdmin(prismaDocument.admin) : undefined,
    })
  }

  static toDomainDocuments(prismaDocuments: any[]): Document[] {
    return prismaDocuments
      .map((document) => this.toDomainDocument(document))
      .filter((doc): doc is Document => doc !== null)
  }
}
