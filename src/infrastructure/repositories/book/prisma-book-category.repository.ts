import { Prisma, PrismaClient } from '@prisma/client'
import { BookCategoryEntity } from 'src/domain/entities'
import { CreateBookCategoryData, IBookCategoryRepository } from 'src/domain/repositories'
import { PrismaService } from 'src/prisma/prisma.service'
import { BookCategoryMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaBookCategoryRepository implements IBookCategoryRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateBookCategoryData): Promise<BookCategoryEntity> {
    return BookCategoryMapper.toDomain(await this.prisma.bookCategory.create({ data }))
  }

  async findById(bookCategoryId: number): Promise<BookCategoryEntity | null> {
    const record = await this.prisma.bookCategory.findUnique({ where: { bookCategoryId } })
    return record ? BookCategoryMapper.toDomain(record) : null
  }

  async findBySlug(slug: string): Promise<BookCategoryEntity | null> {
    const record = await this.prisma.bookCategory.findUnique({ where: { slug } })
    return record ? BookCategoryMapper.toDomain(record) : null
  }

  async findAll(options?: { isActive?: boolean }): Promise<BookCategoryEntity[]> {
    const records = await this.prisma.bookCategory.findMany({
      where: options?.isActive === undefined ? undefined : { isActive: options.isActive },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return BookCategoryMapper.toDomainList(records)
  }

  async update(bookCategoryId: number, data: Partial<CreateBookCategoryData>): Promise<BookCategoryEntity> {
    return BookCategoryMapper.toDomain(await this.prisma.bookCategory.update({ where: { bookCategoryId }, data }))
  }

  async countBooks(bookCategoryId: number): Promise<number> {
    return this.prisma.bookCategoryBook.count({ where: { bookCategoryId } })
  }

  async delete(bookCategoryId: number): Promise<void> {
    await this.prisma.bookCategory.delete({ where: { bookCategoryId } })
  }
}
