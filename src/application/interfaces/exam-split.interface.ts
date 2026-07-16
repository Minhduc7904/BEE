/** Application port and Nest injection token for ExamSplitService. */
export abstract class ExamSplitService {}

export interface ExamSplitService {
  splitExam(...args: any[]): any
}
import type { Difficulty, QuestionType } from 'src/shared/enums'

export interface SplitStatement { content: string; isCorrect: boolean; order: number; difficulty?: Difficulty | null }
export interface SplitQuestion { order: number; part: string | null; content: string; type: QuestionType; subjectId?: number | null; correctAnswer?: string | null; solution?: string | null; difficulty?: Difficulty | null; pointsOrigin?: number | null; statements?: SplitStatement[] }

