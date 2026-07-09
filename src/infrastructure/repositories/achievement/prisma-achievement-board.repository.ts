import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import {
  AchievementBoardListOptions,
  CreateAchievementBoardData,
  CreateAchievementRowData,
  IAchievementBoardRepository,
  UpdateAchievementBoardData,
  UpdateAchievementRowData,
} from 'src/domain/repositories'
import { AchievementBoardEntity, AchievementRowEntity } from 'src/domain/entities'
import { AchievementBoardMapper } from 'src/infrastructure/mappers'

type Prismaish = Prisma.TransactionClient | PrismaService

export class PrismaAchievementBoardRepository implements IAchievementBoardRepository {
  constructor(private readonly prisma: Prismaish) {}

  async create(data: CreateAchievementBoardData): Promise<AchievementBoardEntity> {
    const board = await (this.prisma as any).achievementBoard.create({
      data,
      include: this.includeRows(),
    })

    return AchievementBoardMapper.toDomain(board)
  }

  async findById(achievementBoardId: number, includeRows = true): Promise<AchievementBoardEntity | null> {
    const board = await (this.prisma as any).achievementBoard.findUnique({
      where: { achievementBoardId },
      include: includeRows ? this.includeRows() : undefined,
    })

    return board ? AchievementBoardMapper.toDomain(board) : null
  }

  async findBySlug(slug: string, includeRows = true): Promise<AchievementBoardEntity | null> {
    const board = await (this.prisma as any).achievementBoard.findUnique({
      where: { slug },
      include: includeRows ? this.includeRows() : undefined,
    })

    return board ? AchievementBoardMapper.toDomain(board) : null
  }

  async findAllWithPagination(options: AchievementBoardListOptions): Promise<{
    data: AchievementBoardEntity[]
    total: number
  }> {
    const where = this.buildWhere(options)

    const [boards, total] = await Promise.all([
      (this.prisma as any).achievementBoard.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: {
          [options.sortBy]: options.sortOrder,
        },
        include: options.includeRows ? this.includeRows() : undefined,
      }),
      (this.prisma as any).achievementBoard.count({ where }),
    ])

    return {
      data: AchievementBoardMapper.toDomainList(boards),
      total,
    }
  }

  async update(achievementBoardId: number, data: UpdateAchievementBoardData): Promise<AchievementBoardEntity> {
    const board = await (this.prisma as any).achievementBoard.update({
      where: { achievementBoardId },
      data,
      include: this.includeRows(),
    })

    return AchievementBoardMapper.toDomain(board)
  }

  async delete(achievementBoardId: number): Promise<void> {
    await (this.prisma as any).achievementBoard.delete({
      where: { achievementBoardId },
    })
  }

  async incrementViewCount(achievementBoardId: number): Promise<AchievementBoardEntity> {
    const board = await (this.prisma as any).achievementBoard.update({
      where: { achievementBoardId },
      data: { viewCount: { increment: 1 } },
      include: this.includeRows(),
    })

    return AchievementBoardMapper.toDomain(board)
  }

  async createRows(data: CreateAchievementRowData[]): Promise<AchievementRowEntity[]> {
    if (!data.length) return []

    const rows = await Promise.all(
      data.map((row) =>
        (this.prisma as any).achievementRow.create({
          data: row,
        }),
      ),
    )

    return AchievementBoardMapper.toDomainRows(rows)
  }

  async findRowById(achievementRowId: number): Promise<AchievementRowEntity | null> {
    const row = await (this.prisma as any).achievementRow.findUnique({
      where: { achievementRowId },
    })

    return row ? AchievementBoardMapper.toDomainRow(row) : null
  }

  async updateRow(achievementRowId: number, data: UpdateAchievementRowData): Promise<AchievementRowEntity> {
    const row = await (this.prisma as any).achievementRow.update({
      where: { achievementRowId },
      data,
    })

    return AchievementBoardMapper.toDomainRow(row)
  }

  async deleteRow(achievementRowId: number): Promise<void> {
    await (this.prisma as any).achievementRow.delete({
      where: { achievementRowId },
    })
  }

  private includeRows() {
    return {
      rows: {
        orderBy: [{ sortOrder: 'asc' }, { achievementRowId: 'asc' }],
      },
    }
  }

  private buildWhere(options: AchievementBoardListOptions) {
    const where: any = {}

    if (options.search) {
      where.OR = [
        { title: { contains: options.search } },
        { slug: { contains: options.search } },
        { competitionName: { contains: options.search } },
        { academicYear: { contains: options.search } },
        { description: { contains: options.search } },
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

    return Object.keys(where).length > 0 ? where : undefined
  }
}
