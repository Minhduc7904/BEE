import { Chapter as PrismaChapter } from '@prisma/client'
import { Chapter } from '../../domain/entities/chapter/chapter.entity'

export class ChapterMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomainChapter(prisma: PrismaChapter | null): Chapter | null {
    if (!prisma) return null

    return new Chapter({
      chapterId: prisma.chapterId,
      subjectId: prisma.subjectId,
      name: prisma.name,
      slug: prisma.slug,
      parentChapterId: prisma.parentChapterId,
      orderInParent: prisma.orderInParent,
      level: prisma.level,
    })
  }

  /**
   * Convert array of Prisma models to Domain entities
   */
  static toDomainChapters(prismaChapters: PrismaChapter[]): Chapter[] {
    return prismaChapters.map((prisma) => this.toDomainChapter(prisma)!).filter(Boolean)
  }

  /**
   * Convert Prisma model with relations to Domain entity
   */
  static toDomainChapterWithRelations(prisma: any): Chapter | null {
    if (!prisma) return null

    return new Chapter({
      chapterId: prisma.chapterId,
      subjectId: prisma.subjectId,
      name: prisma.name,
      slug: prisma.slug,
      parentChapterId: prisma.parentChapterId,
      orderInParent: prisma.orderInParent,
      level: prisma.level,
      subject: prisma.subject || undefined,
      parent: prisma.parent ? this.toDomainChapter(prisma.parent) : null,
      children: prisma.children ? this.toDomainChapters(prisma.children) : [],
    })
  }
}
