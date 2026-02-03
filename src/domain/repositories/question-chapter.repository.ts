// src/domain/repositories/question-chapter.repository.ts
import { QuestionChapter } from '../entities/exam/question-chapter.entity'

export interface CreateQuestionChapterData {
  questionId: number
  chapterId: number
}

export interface IQuestionChapterRepository {
  create(data: CreateQuestionChapterData, txClient?: any): Promise<QuestionChapter>
  createMany(dataArray: CreateQuestionChapterData[], txClient?: any): Promise<number>
  findByQuestionId(questionId: number, txClient?: any): Promise<QuestionChapter[]>
  delete(questionId: number, chapterId: number, txClient?: any): Promise<void>
  deleteByQuestionId(questionId: number, txClient?: any): Promise<number>
}
