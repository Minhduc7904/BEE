/** Application port and Nest injection token for QuestionChapterClassificationService. */
export abstract class QuestionChapterClassificationService {}

export interface QuestionChapterClassificationService {
  classifyQuestions(...args: any[]): any
}
export interface QuestionToClassify { questionId: number; subjectId: number | null; content: string; statements?: Array<{ content: string }> }

