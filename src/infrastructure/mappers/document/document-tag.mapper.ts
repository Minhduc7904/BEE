import { DocumentTagEntity } from 'src/domain/entities'
import { DocumentMapper } from './document.mapper'
import { TagMapper } from './tag.mapper'

export class DocumentTagMapper {
  static toDomain(
    prismaDocumentTag: any,
    options?: {
      includeDocument?: boolean
      includeTag?: boolean
    },
  ): DocumentTagEntity {
    return new DocumentTagEntity({
      documentId: prismaDocumentTag.documentId,
      tagId: prismaDocumentTag.tagId,
      sortOrder: prismaDocumentTag.sortOrder ?? 0,
      createdAt: prismaDocumentTag.createdAt,
      document:
        options?.includeDocument && prismaDocumentTag.document
          ? DocumentMapper.toDomain(prismaDocumentTag.document, {
              includeTags: false,
            })
          : undefined,
      tag:
        options?.includeTag && prismaDocumentTag.tag
          ? TagMapper.toDomain(prismaDocumentTag.tag, {
              includeDocuments: false,
            })
          : undefined,
    })
  }

  static toDomainList(
    prismaDocumentTags: any[],
    options?: {
      includeDocument?: boolean
      includeTag?: boolean
    },
  ): DocumentTagEntity[] {
    return prismaDocumentTags.map((documentTag) =>
      this.toDomain(documentTag, options),
    )
  }
}
