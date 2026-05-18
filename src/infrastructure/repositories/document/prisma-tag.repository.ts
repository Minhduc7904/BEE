import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateTagData, ITagRepository, TagListOptions, UpdateTagData } from 'src/domain/repositories/tag.repository'
import { TagEntity } from 'src/domain/entities'
import { TagMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaTagRepository implements ITagRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateTagData): Promise<TagEntity> {
    const tag = await (this.prisma as any).tag.create({
      data,
    })

    return TagMapper.toDomain(tag)
  }

  async upsertByName(data: CreateTagData): Promise<TagEntity> {
    const tag = await (this.prisma as any).tag.upsert({
      where: { name: data.name },
      update: {
        slug: data.slug,
        type: data.type,
        description: data.description,
        isActive: data.isActive,
      },
      create: data,
    })

    return TagMapper.toDomain(tag)
  }

  async findById(tagId: number, includeDocuments = false): Promise<TagEntity | null> {
    const tag = await (this.prisma as any).tag.findUnique({
      where: { tagId },
      include: this.buildInclude(includeDocuments),
    })

    return tag ? TagMapper.toDomain(tag, { includeDocuments }) : null
  }

  async findBySlug(slug: string, includeDocuments = false): Promise<TagEntity | null> {
    const tag = await (this.prisma as any).tag.findUnique({
      where: { slug },
      include: this.buildInclude(includeDocuments),
    })

    return tag ? TagMapper.toDomain(tag, { includeDocuments }) : null
  }

  async findByName(name: string): Promise<TagEntity | null> {
    const tag = await (this.prisma as any).tag.findUnique({
      where: { name },
    })

    return tag ? TagMapper.toDomain(tag) : null
  }

  async findManyByIds(tagIds: number[]): Promise<TagEntity[]> {
    if (tagIds.length === 0) return []

    const tags = await (this.prisma as any).tag.findMany({
      where: {
        tagId: {
          in: tagIds,
        },
      },
    })

    return TagMapper.toDomainList(tags)
  }

  async findAllWithPagination(options: TagListOptions): Promise<{ data: TagEntity[]; total: number }> {
    const where = this.buildWhere(options)
    const include = this.buildInclude(options.includeDocuments)

    const [tags, total] = await Promise.all([
      (this.prisma as any).tag.findMany({
        where,
        include,
        skip: options.skip,
        take: options.take,
        orderBy: {
          [options.sortBy]: options.sortOrder,
        },
      }),
      (this.prisma as any).tag.count({ where }),
    ])

    return {
      data: TagMapper.toDomainList(tags, { includeDocuments: options.includeDocuments }),
      total,
    }
  }

  async update(tagId: number, data: UpdateTagData): Promise<TagEntity> {
    const tag = await (this.prisma as any).tag.update({
      where: { tagId },
      data,
    })

    return TagMapper.toDomain(tag)
  }

  async delete(tagId: number): Promise<void> {
    await (this.prisma as any).tag.delete({
      where: { tagId },
    })
  }

  private buildInclude(includeDocuments?: boolean) {
    return includeDocuments
      ? {
          documents: {
            include: {
              document: true,
            },
          },
        }
      : undefined
  }

  private buildWhere(options: TagListOptions) {
    const where: any = {}

    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { slug: { contains: options.search } },
        { description: { contains: options.search } },
      ]
    }

    if (options.isActive !== undefined) {
      where.isActive = options.isActive
    }

    if (options.type) {
      where.type = options.type
    }

    return Object.keys(where).length > 0 ? where : undefined
  }
}
