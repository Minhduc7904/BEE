import { Prisma } from '@prisma/client'
import { BookEntity } from 'src/domain/entities'
import { BookListOptions, BookRelationOptions, CreateBookData, IBookRepository } from 'src/domain/repositories'
import { PrismaService } from 'src/prisma/prisma.service'
import { BookMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaBookRepository implements IBookRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateBookData): Promise<BookEntity> {
    const { categoryIds, structuredData, ...bookData } = data
    const record = await this.prisma.book.create({
      data: {
        ...bookData,
        structuredData: structuredData as Prisma.InputJsonValue | undefined,
        categoryLinks: { create: categoryIds.map((bookCategoryId) => ({ bookCategoryId })) },
      },
      include: this.buildInclude({ includeCategories: true }),
    })
    return BookMapper.toDomain(record)
  }

  async findById(bookId: number, options?: BookRelationOptions): Promise<BookEntity | null> {
    const record = await this.prisma.book.findUnique({
      where: { bookId },
      include: this.buildInclude(options),
    })
    return record ? BookMapper.toDomain(record) : null
  }

  async findBySlug(slug: string, options?: BookRelationOptions): Promise<BookEntity | null> {
    const record = await this.prisma.book.findUnique({
      where: { slug },
      include: this.buildInclude(options),
    })
    return record ? BookMapper.toDomain(record) : null
  }

  async findBySku(sku: string): Promise<BookEntity | null> {
    const record = await this.prisma.book.findUnique({ where: { sku } })
    return record ? BookMapper.toDomain(record) : null
  }

  async findByIsbn(isbn: string): Promise<BookEntity | null> {
    const record = await this.prisma.book.findUnique({ where: { isbn } })
    return record ? BookMapper.toDomain(record) : null
  }

  async findAllWithPagination(options: BookListOptions): Promise<{ data: BookEntity[]; total: number }> {
    const where = this.buildWhere(options)
    const [records, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
        include: this.buildInclude(options),
      }),
      this.prisma.book.count({ where }),
    ])
    return { data: BookMapper.toDomainList(records), total }
  }

  async update(bookId: number, data: Partial<CreateBookData>): Promise<BookEntity> {
    const { categoryIds, structuredData, ...bookData } = data
    const record = await this.prisma.book.update({
      where: { bookId },
      data: {
        ...bookData,
        ...(structuredData === undefined
          ? {}
          : { structuredData: structuredData === null ? Prisma.DbNull : (structuredData as Prisma.InputJsonValue) }),
        ...(categoryIds === undefined
          ? {}
          : { categoryLinks: { deleteMany: {}, create: categoryIds.map((bookCategoryId) => ({ bookCategoryId })) } }),
      },
      include: this.buildInclude({ includeCategories: true }),
    })
    return BookMapper.toDomain(record)
  }

  async incrementViewCount(bookId: number): Promise<BookEntity> {
    return BookMapper.toDomain(
      await this.prisma.book.update({ where: { bookId }, data: { viewCount: { increment: 1 } } }),
    )
  }

  async delete(bookId: number): Promise<void> {
    await this.prisma.book.delete({ where: { bookId } })
  }

  private buildInclude(options?: BookRelationOptions): Prisma.BookInclude | undefined {
    if (!options?.includeCategories) return undefined
    return { categoryLinks: { include: { category: true }, orderBy: { category: { sortOrder: 'asc' } } } }
  }

  private buildWhere(options: BookListOptions): Prisma.BookWhereInput {
    const where: Prisma.BookWhereInput = {}
    if (options.visibility) where.visibility = options.visibility
    if (options.isFeatured !== undefined) where.isFeatured = options.isFeatured
    if (options.categorySlug) where.categoryLinks = { some: { category: { slug: options.categorySlug } } }
    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { sku: { contains: options.search } },
        { author: { contains: options.search } },
        { publisher: { contains: options.search } },
      ]
    }
    return where
  }
}
