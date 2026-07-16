/** Application port and Nest injection token for CompetitionSubmitFeedbackAiService. */
export abstract class CompetitionSubmitFeedbackAiService {}

export interface CompetitionSubmitFeedbackAiService {
  generateFeedbackFromStatistics(...args: any[]): any
}
export interface CompetitionSubmitStatsForAi { competitionSubmitId: number; competitionId: number; examId: number; studentId: number; totalPoints: number; maxPoints: number; scorePercentage: number; totals: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number }; bySection: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>; byChapter: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>; byDifficulty: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }>; byQuestionType: Array<{ key: string; label: string; counts: { total: number; correct: number; incorrect: number; unanswered: number; ungraded: number } }> }

