// src/infrastructure/mappers/chapter.mapper.ts

import { Chapter } from '../../../domain/entities/chapter/chapter.entity'
import { SubjectMapper } from './subject.mapper'

/**
 * Mapper class để convert từ Prisma Chapter model
 * sang Domain Chapter entity
 */
export class ChapterMapper {
  /**
   * Convert Prisma Chapter sang Domain Chapter (không relations)
   */
  static toDomainChapter(prismaChapter: any): Chapter | undefined {
    if (!prismaChapter) return undefined

    return new Chapter({
      chapterId: prismaChapter.chapterId,
      subjectId: prismaChapter.subjectId,
      name: prismaChapter.name,
      slug: prismaChapter.slug,
      parentChapterId: prismaChapter.parentChapterId ?? null,
      orderInParent: prismaChapter.orderInParent,
      level: prismaChapter.level,
    })
  }

  /**
   * Convert array Prisma Chapters sang Domain Chapters
   */
  static toDomainChapters(prismaChapters: any[]): Chapter[] {
    return prismaChapters
      .map((chapter) => this.toDomainChapter(chapter))
      .filter(Boolean) as Chapter[]
  }

  /**
   * Convert Prisma Chapter có relations sang Domain Chapter
   */
  static toDomainChapterWithRelations(prismaChapter: any): Chapter | undefined {
    if (!prismaChapter) return undefined

    return new Chapter({
      chapterId: prismaChapter.chapterId,
      subjectId: prismaChapter.subjectId,
      name: prismaChapter.name,
      slug: prismaChapter.slug,
      parentChapterId: prismaChapter.parentChapterId ?? null,
      orderInParent: prismaChapter.orderInParent,
      level: prismaChapter.level,

      subject: prismaChapter.subject
        ? SubjectMapper.toDomainSubject(prismaChapter.subject) ?? undefined
        : undefined,

      parent: prismaChapter.parent
        ? this.toDomainChapterWithRelations(prismaChapter.parent)
        : null,

      children: prismaChapter.children
        ? this.toDomainChapters(prismaChapter.children)
        : [],
    })
  }
}
