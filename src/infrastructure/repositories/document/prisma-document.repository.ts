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
import { TextSearchUtil } from 'src/shared/utils'

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
    if (options.search) {
      return this.findAllWithAccentInsensitiveSearch(options)
    }

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

  private async findAllWithAccentInsensitiveSearch(
    options: DocumentListOptions,
  ): Promise<{ data: DocumentEntity[]; total: number }> {
    const conditions: string[] = []
    const params: any[] = []
    const search = options.search || ''

    if (options.visibility) {
      conditions.push('d.visibility = ?')
      params.push(options.visibility)
    }

    if (options.isFeatured !== undefined) {
      conditions.push('d.is_featured = ?')
      params.push(options.isFeatured)
    }

    if (options.requiredTagId) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM documents_tags dt_required
        WHERE dt_required.document_id = d.document_id
          AND dt_required.tag_id = ?
      )`)
      params.push(options.requiredTagId)
    }

    if (options.tagSlugs?.length) {
      const placeholders = options.tagSlugs.map(() => '?').join(', ')
      conditions.push(`EXISTS (
        SELECT 1
        FROM documents_tags dt_slug
        INNER JOIN tags t_slug ON t_slug.tag_id = dt_slug.tag_id
        WHERE dt_slug.document_id = d.document_id
          AND t_slug.slug IN (${placeholders})
      )`)
      params.push(...options.tagSlugs)
    } else if (options.tagIds?.length) {
      const placeholders = options.tagIds.map(() => '?').join(', ')
      conditions.push(`EXISTS (
        SELECT 1
        FROM documents_tags dt_filter
        WHERE dt_filter.document_id = d.document_id
          AND dt_filter.tag_id IN (${placeholders})
      )`)
      params.push(...options.tagIds)
    } else if (options.tagId) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM documents_tags dt_filter
        WHERE dt_filter.document_id = d.document_id
          AND dt_filter.tag_id = ?
      )`)
      params.push(options.tagId)
    }

    const searchPattern = `%${search}%`
    const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(search)}%`
    const searchableColumns = [
      'd.title',
      'd.slug',
      'd.short_description',
      'd.target_keyword',
      'd.keyword_text',
      'd.meta_title',
      'd.meta_description',
    ]

    const rawSearchConditions = searchableColumns.map(
      (column) => `LOWER(IFNULL(${column}, '')) LIKE LOWER(?)`,
    )
    const normalizedSearchConditions = searchableColumns.map(
      (column) => `LOWER(IFNULL(${this.buildRemoveAccentsSQL(column)}, '')) LIKE LOWER(?)`,
    )

    conditions.push(`(
      ${rawSearchConditions.join(' OR ')} OR
      ${normalizedSearchConditions.join(' OR ')}
    )`)
    params.push(
      ...searchableColumns.map(() => searchPattern),
      ...searchableColumns.map(() => normalizedSearch),
    )

    const orderColumnMap: Record<string, string> = {
      documentId: 'd.document_id',
      title: 'd.title',
      slug: 'd.slug',
      visibility: 'd.visibility',
      isFeatured: 'd.is_featured',
      viewCount: 'd.view_count',
      downloadCount: 'd.download_count',
      createdAt: 'd.created_at',
      updatedAt: 'd.updated_at',
    }
    const orderColumn = orderColumnMap[options.sortBy] || 'd.created_at'
    const sortOrder = options.sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const baseFrom = `FROM documents d ${whereClause}`
    const countQuery = `SELECT COUNT(*) AS total ${baseFrom}`
    const idsQuery = `
      SELECT d.document_id
      ${baseFrom}
      ORDER BY ${orderColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `

    const [countResult, idRows] = await Promise.all([
      (this.prisma as any).$queryRawUnsafe(countQuery, ...params) as Promise<Array<{ total: number | bigint }>>,
      (this.prisma as any).$queryRawUnsafe(idsQuery, ...params, options.take, options.skip) as Promise<
        Array<{ document_id: number }>
      >,
    ])

    const documentIds = idRows.map((row) => row.document_id)
    const total = Number(countResult[0]?.total || 0)

    if (documentIds.length === 0) {
      return { data: [], total }
    }

    const documents = await (this.prisma as any).document.findMany({
      where: {
        documentId: {
          in: documentIds,
        },
      },
      include: this.buildInclude(options.includeTags),
      orderBy: {
        [options.sortBy]: options.sortOrder,
      },
    })

    return {
      data: DocumentMapper.toDomainList(documents, { includeTags: options.includeTags }),
      total,
    }
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

    if (options.tagSlugs?.length) {
      tagConditions.push({
        tags: {
          some: {
            tag: {
              slug: {
                in: options.tagSlugs,
              },
            },
          },
        },
      })
    }

    if (tagConditions.length > 0) {
      where.AND = tagConditions
    }

    return Object.keys(where).length > 0 ? where : undefined
  }

  private buildRemoveAccentsSQL(columnName: string): string {
    const replacements = [
      ['à', 'a'], ['á', 'a'], ['ạ', 'a'], ['ả', 'a'], ['ã', 'a'],
      ['â', 'a'], ['ầ', 'a'], ['ấ', 'a'], ['ậ', 'a'], ['ẩ', 'a'], ['ẫ', 'a'],
      ['ă', 'a'], ['ằ', 'a'], ['ắ', 'a'], ['ặ', 'a'], ['ẳ', 'a'], ['ẵ', 'a'],
      ['è', 'e'], ['é', 'e'], ['ẹ', 'e'], ['ẻ', 'e'], ['ẽ', 'e'],
      ['ê', 'e'], ['ề', 'e'], ['ế', 'e'], ['ệ', 'e'], ['ể', 'e'], ['ễ', 'e'],
      ['ì', 'i'], ['í', 'i'], ['ị', 'i'], ['ỉ', 'i'], ['ĩ', 'i'],
      ['ò', 'o'], ['ó', 'o'], ['ọ', 'o'], ['ỏ', 'o'], ['õ', 'o'],
      ['ô', 'o'], ['ồ', 'o'], ['ố', 'o'], ['ộ', 'o'], ['ổ', 'o'], ['ỗ', 'o'],
      ['ơ', 'o'], ['ờ', 'o'], ['ớ', 'o'], ['ợ', 'o'], ['ở', 'o'], ['ỡ', 'o'],
      ['ù', 'u'], ['ú', 'u'], ['ụ', 'u'], ['ủ', 'u'], ['ũ', 'u'],
      ['ư', 'u'], ['ừ', 'u'], ['ứ', 'u'], ['ự', 'u'], ['ử', 'u'], ['ữ', 'u'],
      ['ỳ', 'y'], ['ý', 'y'], ['ỵ', 'y'], ['ỷ', 'y'], ['ỹ', 'y'],
      ['đ', 'd'],
      ['À', 'A'], ['Á', 'A'], ['Ạ', 'A'], ['Ả', 'A'], ['Ã', 'A'],
      ['Â', 'A'], ['Ầ', 'A'], ['Ấ', 'A'], ['Ậ', 'A'], ['Ẩ', 'A'], ['Ẫ', 'A'],
      ['Ă', 'A'], ['Ằ', 'A'], ['Ắ', 'A'], ['Ặ', 'A'], ['Ẳ', 'A'], ['Ẵ', 'A'],
      ['È', 'E'], ['É', 'E'], ['Ẹ', 'E'], ['Ẻ', 'E'], ['Ẽ', 'E'],
      ['Ê', 'E'], ['Ề', 'E'], ['Ế', 'E'], ['Ệ', 'E'], ['Ể', 'E'], ['Ễ', 'E'],
      ['Ì', 'I'], ['Í', 'I'], ['Ị', 'I'], ['Ỉ', 'I'], ['Ĩ', 'I'],
      ['Ò', 'O'], ['Ó', 'O'], ['Ọ', 'O'], ['Ỏ', 'O'], ['Õ', 'O'],
      ['Ô', 'O'], ['Ồ', 'O'], ['Ố', 'O'], ['Ộ', 'O'], ['Ổ', 'O'], ['Ỗ', 'O'],
      ['Ơ', 'O'], ['Ờ', 'O'], ['Ớ', 'O'], ['Ợ', 'O'], ['Ở', 'O'], ['Ỡ', 'O'],
      ['Ù', 'U'], ['Ú', 'U'], ['Ụ', 'U'], ['Ủ', 'U'], ['Ũ', 'U'],
      ['Ư', 'U'], ['Ừ', 'U'], ['Ứ', 'U'], ['Ự', 'U'], ['Ử', 'U'], ['Ữ', 'U'],
      ['Ỳ', 'Y'], ['Ý', 'Y'], ['Ỵ', 'Y'], ['Ỷ', 'Y'], ['Ỹ', 'Y'],
      ['Đ', 'D'],
    ]

    return replacements.reduce(
      (expression, [from, to]) => `REPLACE(${expression}, '${from}', '${to}')`,
      columnName,
    )
  }
}
