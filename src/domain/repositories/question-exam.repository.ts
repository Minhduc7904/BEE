// src/domain/repositories/question-exam.repository.ts
import { QuestionExam } from '../entities/exam/question-exam.entity'

export interface CreateQuestionExamData {
  questionId: number
  examId: number
  sectionId: number | null
  order: number
  points?: number | null
}

export interface IQuestionExamRepository {
  create(data: CreateQuestionExamData, txClient?: any): Promise<QuestionExam>
  createMany(dataArray: CreateQuestionExamData[], txClient?: any): Promise<number>
  findByExamId(examId: number, txClient?: any): Promise<QuestionExam[]>
  findBySectionId(sectionId: number, txClient?: any): Promise<QuestionExam[]>
  findByQuestionAndExam(questionId: number, examId: number, txClient?: any): Promise<QuestionExam | null>
  update(questionId: number, examId: number, data: Partial<CreateQuestionExamData>, txClient?: any): Promise<QuestionExam>
  delete(questionId: number, examId: number, txClient?: any): Promise<void>
}
