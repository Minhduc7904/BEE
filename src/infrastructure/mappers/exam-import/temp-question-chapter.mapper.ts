// src/infrastructure/mappers/exam-import/temp-question-chapter.mapper.ts

import { TempQuestionChapter } from '../../../domain/entities/exam-import/temp-question-chapter.entity'
import { TempQuestionMapper } from './temp-question.mapper'
import { ChapterMapper } from '../subject/chapter.mapper'

/**
 * Mapper class để convert từ Prisma TempQuestionChapter model
 * sang Domain TempQuestionChapter entity
 */
export class TempQuestionChapterMapper {
  /**
   * Convert Prisma TempQuestionChapter sang Domain TempQuestionChapter
   */
  static toDomainTempQuestionChapter(
    prismaTempQuestionChapter: any,
  ): TempQuestionChapter | undefined {
    if (!prismaTempQuestionChapter) return undefined

    return new TempQuestionChapter({
      tempQuestionId: prismaTempQuestionChapter.tempQuestionId,
      chapterId: prismaTempQuestionChapter.chapterId,
      tempQuestion: prismaTempQuestionChapter.tempQuestion
        ? TempQuestionMapper.toDomainTempQuestion(prismaTempQuestionChapter.tempQuestion)
        : undefined,
      chapter: prismaTempQuestionChapter.chapter
        ? ChapterMapper.toDomainChapter(prismaTempQuestionChapter.chapter)
        : undefined,
    })
  }

  /**
   * Convert array Prisma TempQuestionChapters sang Domain TempQuestionChapters
   */
  static toDomainTempQuestionChapters(prismaTempQuestionChapters: any[]): TempQuestionChapter[] {
    return prismaTempQuestionChapters
      .map((tqc) => this.toDomainTempQuestionChapter(tqc))
      .filter(Boolean) as TempQuestionChapter[]
  }
}
