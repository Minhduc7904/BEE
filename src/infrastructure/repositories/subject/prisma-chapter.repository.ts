import { Injectable } from '@nestjs/common'
import { Chapter } from '../../../domain/entities/chapter/chapter.entity'
import {
  CreateChapterData,
  IChapterRepository,
  UpdateChapterData,
  FindAllChaptersOptions,
  FindAllChaptersResult,
} from '../../../domain/repositories/chapter.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ChapterMapper } from '../../mappers/subject/chapter.mapper'
import { NumberUtil } from '../../../shared/utils'

@Injectable()
export class PrismaChapterRepository implements IChapterRepository {
  constructor(private readonly prisma: PrismaService | any) {}

  async create(data: CreateChapterData): Promise<Chapter> {
    const created = await this.prisma.chapter.create({
      data: {
        subjectId: data.subjectId,
        name: data.name,
        code: data.code,
        slug: data.slug,
        parentChapterId: data.parentChapterId,
        orderInParent: data.orderInParent,
        level: data.level || 0,
      },
      include: {
        subject: true,
        parent: true,
      },
    })

    return ChapterMapper.toDomainChapterWithRelations(created)!
  }

  async findById(id: number): Promise<Chapter | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Chapter ID')

    const chapter = await this.prisma.chapter.findUnique({
      where: { chapterId: numericId },
      include: {
        subject: true,
        parent: true,
        children: {
          orderBy: { orderInParent: 'asc' },
        },
      },
    })

    if (!chapter) return null

    return ChapterMapper.toDomainChapterWithRelations(chapter)!
  }

  async findBySlug(slug: string): Promise<Chapter | null> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { slug: slug },
      include: {
        subject: true,
        parent: true,
        children: {
          orderBy: { orderInParent: 'asc' },
        },
      },
    })

    if (!chapter) return null

    return ChapterMapper.toDomainChapterWithRelations(chapter)!
  }

  async findBySubjectId(subjectId: number): Promise<Chapter[]> {
    const chapters = await this.prisma.chapter.findMany({
      where: { subjectId: subjectId },
      orderBy: [{ level: 'asc' }, { orderInParent: 'asc' }],
      include: {
        parent: true,
      },
    })

    return ChapterMapper.toDomainChapters(chapters)
  }

  async findByParentChapterId(parentChapterId: number | null): Promise<Chapter[]> {
    const chapters = await this.prisma.chapter.findMany({
      where: { parentChapterId: parentChapterId },
      orderBy: { orderInParent: 'asc' },
    })

    return ChapterMapper.toDomainChapters(chapters)
  }

  async findRootChapters(subjectId: number): Promise<Chapter[]> {
    const chapters = await this.prisma.chapter.findMany({
      where: {
        subjectId: subjectId,
        parentChapterId: null,
      },
      orderBy: { orderInParent: 'asc' },
    })

    return ChapterMapper.toDomainChapters(chapters)
  }

  async findAll(limit?: number, offset?: number): Promise<Chapter[]> {
    const chapters = await this.prisma.chapter.findMany({
      take: limit,
      skip: offset,
      orderBy: [{ level: 'asc' }, { orderInParent: 'asc' }],
    })

    return ChapterMapper.toDomainChapters(chapters)
  }

  async findAllWithPagination(options: FindAllChaptersOptions): Promise<FindAllChaptersResult> {
    const where: any = {}

    // Search filter
    if (options.search) {
      where.OR = [
        { name: { contains: options.search } },
        { slug: { contains: options.search } },
        { code: { contains: options.search } },
      ]
    }

    // Subject filter
    if (options.subjectId) {
      where.subjectId = options.subjectId
    }

    // Parent chapter filter
    if (options.parentChapterId !== undefined) {
      where.parentChapterId = options.parentChapterId
    }

    // Level filter
    if (options.level !== undefined) {
      where.level = options.level
    }

    // Sort configuration
    const orderBy: any = {}
    if (options.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'asc'
    } else {
      // Default sort
      orderBy.orderInParent = 'asc'
    }

    // Execute queries in parallel
    const [chapters, total] = await Promise.all([
      this.prisma.chapter.findMany({
        where,
        orderBy,
        skip: options.skip,
        take: options.take,
        include: {
          subject: true,
          parent: true,
        },
      }),
      this.prisma.chapter.count({ where }),
    ])

    return {
      data: chapters.map((chapter) => ChapterMapper.toDomainChapterWithRelations(chapter)!),
      total,
    }
  }

  async update(id: number, data: UpdateChapterData): Promise<Chapter> {
    const numericId = NumberUtil.ensureValidId(id, 'Chapter ID')

    const updated = await this.prisma.chapter.update({
      where: { chapterId: numericId },
      data: {
        subjectId: data.subjectId,
        name: data.name,
        code: data.code,
        slug: data.slug,
        parentChapterId: data.parentChapterId,
        orderInParent: data.orderInParent,
        level: data.level,
      },
      include: {
        subject: true,
        parent: true,
        children: true,
      },
    })

    return ChapterMapper.toDomainChapterWithRelations(updated)!
  }

  async delete(id: number): Promise<void> {
    const numericId = NumberUtil.ensureValidId(id, 'Chapter ID')

    await this.prisma.chapter.delete({
      where: { chapterId: numericId },
    })
  }

  async reorderChapters(parentChapterId: number | null, chapterIds: number[]): Promise<void> {
    // Update orderInParent for each chapter
    await Promise.all(
      chapterIds.map((chapterId, index) =>
        this.prisma.chapter.update({
          where: { chapterId },
          data: { orderInParent: index },
        }),
      ),
    )
  }
}
