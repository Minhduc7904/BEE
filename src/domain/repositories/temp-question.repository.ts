import { TempQuestion } from '../entities/exam-import/temp-question.entity'
import { QuestionType, Difficulty } from '../../shared/enums'

export interface CreateTempQuestionData {
  sessionId: string
  tempSectionId?: string
  content: string
  type: QuestionType
  correctAnswer?: string
  solution?: string
  difficulty?: Difficulty
  solutionYoutubeUrl?: string
  grade?: number
  subjectId?: number
  pointsOrigin?: number
  order: number
  metadata?: any
}

export interface UpdateTempQuestionData {
  tempSectionId?: string
  content?: string
  type?: QuestionType
  correctAnswer?: string
  solution?: string
  difficulty?: Difficulty
  solutionYoutubeUrl?: string
  grade?: number
  subjectId?: number
  pointsOrigin?: number
  order?: number
  metadata?: any
  questionId?: number
}

export interface FindTempQuestionsOptions {
  sessionId?: string
  tempSectionId?: string
  subjectId?: number
  type?: QuestionType
  difficulty?: Difficulty
  grade?: number
}

export interface ITempQuestionRepository {
  create(data: CreateTempQuestionData): Promise<TempQuestion>
  findById(tempQuestionId: string): Promise<TempQuestion | null>
  findByIdWithRelations(tempQuestionId: string): Promise<TempQuestion | null>
  findBySessionId(sessionId: string): Promise<TempQuestion[]>
  findByTempSectionId(tempSectionId: string): Promise<TempQuestion[]>
  findByQuestionId(questionId: number): Promise<TempQuestion | null>
  findAll(options?: FindTempQuestionsOptions): Promise<TempQuestion[]>
  update(tempQuestionId: string, data: UpdateTempQuestionData): Promise<TempQuestion>
  delete(tempQuestionId: string): Promise<void>
  linkToFinalQuestion(tempQuestionId: string, questionId: number): Promise<TempQuestion>
}
