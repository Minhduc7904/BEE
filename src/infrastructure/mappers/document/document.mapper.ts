import { DocumentEntity } from 'src/domain/entities'
import { Visibility } from 'src/shared/enums'
import { DocumentTagMapper } from './document-tag.mapper'

export class DocumentMapper {
  static toDomain(
    prismaDocument: any,
    options?: {
      includeTags?: boolean
    },
  ): DocumentEntity {
    return new DocumentEntity({
      documentId: prismaDocument.documentId,
      title: prismaDocument.title,
      slug: prismaDocument.slug,
      shortDescription: prismaDocument.shortDescription ?? null,
      content: prismaDocument.content ?? null,
      sourceName: prismaDocument.sourceName ?? null,
      sourceUrl: prismaDocument.sourceUrl ?? null,
      targetKeyword: prismaDocument.targetKeyword ?? null,
      keywordText: prismaDocument.keywordText ?? null,
      metaTitle: prismaDocument.metaTitle ?? null,
      metaDescription: prismaDocument.metaDescription ?? null,
      ogTitle: prismaDocument.ogTitle ?? null,
      ogDescription: prismaDocument.ogDescription ?? null,
      searchIntent: prismaDocument.searchIntent ?? null,
      seoScore: prismaDocument.seoScore ?? null,
      visibility: prismaDocument.visibility as Visibility,
      isFeatured: prismaDocument.isFeatured ?? false,
      viewCount: prismaDocument.viewCount ?? 0,
      downloadCount: prismaDocument.downloadCount ?? 0,
      readingTime: prismaDocument.readingTime ?? null,
      createdBy: prismaDocument.createdBy ?? null,
      updatedBy: prismaDocument.updatedBy ?? null,
      createdAt: prismaDocument.createdAt,
      updatedAt: prismaDocument.updatedAt,
      tags:
        options?.includeTags && prismaDocument.tags
          ? DocumentTagMapper.toDomainList(prismaDocument.tags, {
              includeTag: true,
            })
          : undefined,
    })
  }

  static toDomainList(
    prismaDocuments: any[],
    options?: {
      includeTags?: boolean
    },
  ): DocumentEntity[] {
    return prismaDocuments.map((document) => this.toDomain(document, options))
  }
}
