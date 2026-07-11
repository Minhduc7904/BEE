import { Prisma } from '@prisma/client'
import { NewsArticleEntity } from 'src/domain/entities'
import {
  CreateNewsArticleData,
  INewsArticleRepository,
  NewsArticleListOptions,
  UpdateNewsArticleData,
} from 'src/domain/repositories'
import { NewsArticleMapper } from 'src/infrastructure/mappers'
import { PrismaService } from 'src/prisma/prisma.service'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaNewsArticleRepository implements INewsArticleRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateNewsArticleData): Promise<NewsArticleEntity> {
    const newsArticle = await (this.prisma as any).newsArticle.create({ data })
    return NewsArticleMapper.toDomain(newsArticle)
  }

  async findById(newsArticleId: number): Promise<NewsArticleEntity | null> {
    const newsArticle = await (this.prisma as any).newsArticle.findUnique({
      where: { newsArticleId },
    })
    return newsArticle ? NewsArticleMapper.toDomain(newsArticle) : null
  }

  async findBySlug(slug: string): Promise<NewsArticleEntity | null> {
    const newsArticle = await (this.prisma as any).newsArticle.findUnique({
      where: { slug },
    })
    return newsArticle ? NewsArticleMapper.toDomain(newsArticle) : null
  }

  async findAllWithPagination(options: NewsArticleListOptions): Promise<{
    data: NewsArticleEntity[]
    total: number
  }> {
    const where = this.buildWhere(options)
    const [newsArticles, total] = await Promise.all([
      (this.prisma as any).newsArticle.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy]: options.sortOrder },
      }),
      (this.prisma as any).newsArticle.count({ where }),
    ])

    return { data: NewsArticleMapper.toDomainList(newsArticles), total }
  }

  async update(newsArticleId: number, data: UpdateNewsArticleData): Promise<NewsArticleEntity> {
    const newsArticle = await (this.prisma as any).newsArticle.update({
      where: { newsArticleId },
      data,
    })
    return NewsArticleMapper.toDomain(newsArticle)
  }

  async incrementViewCount(newsArticleId: number): Promise<NewsArticleEntity> {
    const newsArticle = await (this.prisma as any).newsArticle.update({
      where: { newsArticleId },
      data: { viewCount: { increment: 1 } },
    })
    return NewsArticleMapper.toDomain(newsArticle)
  }

  async delete(newsArticleId: number): Promise<void> {
    await (this.prisma as any).newsArticle.delete({ where: { newsArticleId } })
  }

  private buildWhere(options: NewsArticleListOptions) {
    const where: any = {}

    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { slug: { contains: options.search } },
        { excerpt: { contains: options.search } },
        { authorName: { contains: options.search } },
        { targetKeyword: { contains: options.search } },
        { keywordText: { contains: options.search } },
        { metaTitle: { contains: options.search } },
        { metaDescription: { contains: options.search } },
      ]
    }

    if (options.type) where.type = options.type
    if (options.visibility) where.visibility = options.visibility
    if (options.isFeatured !== undefined) where.isFeatured = options.isFeatured

    return Object.keys(where).length > 0 ? where : undefined
  }
}
