import { TagEntity } from 'src/domain/entities'
import { TagType } from 'src/shared/enums'
import { DocumentTagMapper } from './document-tag.mapper'

export class TagMapper {
  static toDomain(
    prismaTag: any,
    options?: {
      includeDocuments?: boolean
    },
  ): TagEntity {
    return new TagEntity({
      tagId: prismaTag.tagId,
      name: prismaTag.name,
      slug: prismaTag.slug,
      type: prismaTag.type ?? TagType.KEYWORD,
      description: prismaTag.description ?? null,
      isActive: prismaTag.isActive ?? true,
      createdAt: prismaTag.createdAt,
      updatedAt: prismaTag.updatedAt,
      documents:
        options?.includeDocuments && prismaTag.documents
          ? DocumentTagMapper.toDomainList(prismaTag.documents, {
              includeTag: false,
            })
          : undefined,
    })
  }

  static toDomainList(
    prismaTags: any[],
    options?: {
      includeDocuments?: boolean
    },
  ): TagEntity[] {
    return prismaTags.map((tag) => this.toDomain(tag, options))
  }
}
