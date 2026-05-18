import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  CreateDocumentData,
  DocumentListOptions,
  IDocumentRepository,
  UpdateDocumentData,
} from 'src/domain/repositories/document.repository'
import { DocumentEntity } from 'src/domain/entities'
import { DocumentMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateDocumentData): Promise<DocumentEntity> {
    const { tagIds, ...documentData } = data

    const document = await (this.prisma as any).document.create({
      data: {
        ...documentData,
        tags: tagIds?.length
          ? {
              create: Array.from(new Set(tagIds)).map((tagId, index) => ({
                tagId,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: this.buildInclude(true),
    })

    return DocumentMapper.toDomain(document, { includeTags: true })
  }

  async findById(documentId: number, includeTags = false): Promise<DocumentEntity | null> {
    const document = await (this.prisma as any).document.findUnique({
      where: { documentId },
      include: this.buildInclude(includeTags),
    })

    return document ? DocumentMapper.toDomain(document, { includeTags }) : null
  }

  async findBySlug(slug: string, includeTags = false): Promise<DocumentEntity | null> {
    const document = await (this.prisma as any).document.findUnique({
      where: { slug },
      include: this.buildInclude(includeTags),
    })

    return document ? DocumentMapper.toDomain(document, { includeTags }) : null
  }

  async findAllWithPagination(options: DocumentListOptions): Promise<{ data: DocumentEntity[]; total: number }> {
    const where = this.buildWhere(options)
    const include = this.buildInclude(options.includeTags)

    const [documents, total] = await Promise.all([
      (this.prisma as any).document.findMany({
        where,
        include,
        skip: options.skip,
        take: options.take,
        orderBy: {
          [options.sortBy]: options.sortOrder,
        },
      }),
      (this.prisma as any).document.count({ where }),
    ])

    return {
      data: DocumentMapper.toDomainList(documents, { includeTags: options.includeTags }),
      total,
    }
  }

  async update(documentId: number, data: UpdateDocumentData): Promise<DocumentEntity> {
    const { tagIds, ...documentData } = data

    if (tagIds !== undefined) {
      await (this.prisma as any).documentTag.deleteMany({
        where: { documentId },
      })

      if (tagIds.length > 0) {
        await (this.prisma as any).documentTag.createMany({
          data: Array.from(new Set(tagIds)).map((tagId, index) => ({
            documentId,
            tagId,
            sortOrder: index,
          })),
        })
      }
    }

    const document = await (this.prisma as any).document.update({
      where: { documentId },
      data: documentData,
      include: this.buildInclude(true),
    })

    return DocumentMapper.toDomain(document, { includeTags: true })
  }

  async incrementViewCount(documentId: number): Promise<DocumentEntity> {
    const document = await (this.prisma as any).document.update({
      where: { documentId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    return DocumentMapper.toDomain(document)
  }

  async incrementDownloadCount(documentId: number): Promise<DocumentEntity> {
    const document = await (this.prisma as any).document.update({
      where: { documentId },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    })

    return DocumentMapper.toDomain(document)
  }

  async delete(documentId: number): Promise<void> {
    await (this.prisma as any).document.delete({
      where: { documentId },
    })
  }

  private buildInclude(includeTags?: boolean) {
    return includeTags
      ? {
          tags: {
            include: {
              tag: true,
            },
            orderBy: {
              sortOrder: 'asc',
            },
          },
        }
      : undefined
  }

  private buildWhere(options: DocumentListOptions) {
    const where: any = {}

    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { slug: { contains: options.search } },
        { shortDescription: { contains: options.search } },
        { targetKeyword: { contains: options.search } },
        { keywordText: { contains: options.search } },
        { metaTitle: { contains: options.search } },
        { metaDescription: { contains: options.search } },
      ]
    }

    if (options.visibility) {
      where.visibility = options.visibility
    }

    if (options.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured
    }

    const tagConditions: any[] = []

    if (options.requiredTagId) {
      tagConditions.push({
        tags: {
          some: {
            tagId: options.requiredTagId,
          },
        },
      })
    }

    if (options.tagIds?.length) {
      tagConditions.push({
        tags: {
          some: {
            tagId: {
              in: options.tagIds,
            },
          },
        },
      })
    } else if (options.tagId) {
      tagConditions.push({
        tags: {
          some: {
            tagId: options.tagId,
          },
        },
      })
    }

    if (tagConditions.length > 0) {
      where.AND = tagConditions
    }

    return Object.keys(where).length > 0 ? where : undefined
  }
}
