// src/infrastructure/mappers/document.mapper.ts
import { Document } from '../../domain/entities'
import { AdminMapper } from '../mappers'
import { DocumentResponseDto } from '../../application/dtos'

/**
 * Mapper class để convert giữa Prisma Document models, Domain Document entities và DTOs
 */
export class DocumentMapper {
  // Prisma → Domain
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
      admin: prismaDocument.admin
        ? AdminMapper.toDomainAdmin(prismaDocument.admin)
        : undefined,
    })
  }

  static toDomainDocuments(prismaDocuments: any[]): Document[] {
    return prismaDocuments
      .map((document) => this.toDomainDocument(document))
      .filter((doc): doc is Document => doc !== null)
  }

  // Domain → DTO
  static toResponseDto(document: Document): DocumentResponseDto {
    return {
      documentId: document.documentId,
      adminId: document.adminId || undefined,
      url: document.url,
      anotherUrl: document.anotherUrl || undefined,
      description: document.description || undefined,
      mimeType: document.mimeType || undefined,
      subjectId: document.subjectId || undefined,
      subject: document.subject || undefined,
      relatedType: document.relatedType || undefined,
      relatedId: document.relatedId || undefined,
      storageProvider: document.storageProvider,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    }
  }

  static toResponseDtos(documents: Document[]): DocumentResponseDto[] {
    return documents.map((doc) => this.toResponseDto(doc))
  }
}
