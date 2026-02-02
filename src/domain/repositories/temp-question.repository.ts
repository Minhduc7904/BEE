import { TempQuestion } from '../entities/exam-import/temp-question.entity'
import { QuestionType, Difficulty } from '../../shared/enums'

export interface CreateTempQuestionData {
  sessionId: number
  tempSectionId?: number | null
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
  tempSectionId?: number | null
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
  sessionId?: number
  tempSectionId?: number
  subjectId?: number
  type?: QuestionType
  difficulty?: Difficulty
  grade?: number
}

export interface ITempQuestionRepository {
  create(data: CreateTempQuestionData): Promise<TempQuestion>
  findById(tempQuestionId: number): Promise<TempQuestion | null>
  findByIdWithRelations(tempQuestionId: number): Promise<TempQuestion | null>
  findBySessionId(sessionId: number): Promise<TempQuestion[]>
  findByTempSectionId(tempSectionId: number): Promise<TempQuestion[]>
  findByQuestionId(questionId: number): Promise<TempQuestion | null>
  findAll(options?: FindTempQuestionsOptions): Promise<TempQuestion[]>
  update(tempQuestionId: number, data: UpdateTempQuestionData): Promise<TempQuestion>
  delete(tempQuestionId: number): Promise<void>
  linkToFinalQuestion(tempQuestionId: number, questionId: number): Promise<TempQuestion>
}
