export interface StudentCompetitionPointRule {
  minScorePercentage: number
  points: number
}

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseCsv(value: string | undefined, fallback: string[]): string[] {
  const raw = value || fallback.join(',')

  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseCompetitionSubmitRules(): StudentCompetitionPointRule[] {
  const raw = process.env.STUDENT_POINT_COMPETITION_SUBMIT_RULES || '90:1,100:2'

  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [minScorePercentage, points] = part.split(':').map((value) => Number(value.trim()))
      return { minScorePercentage, points }
    })
    .filter((rule) => Number.isFinite(rule.minScorePercentage) && Number.isFinite(rule.points) && rule.points > 0)
    .sort((a, b) => b.minScorePercentage - a.minScorePercentage)
}

export const studentPointConfig = {
  competitionSubmit: {
    enabled: process.env.STUDENT_POINT_COMPETITION_SUBMIT_ENABLED !== 'false',
    source: process.env.STUDENT_POINT_COMPETITION_SUBMIT_SOURCE || 'COMPETITION_SUBMIT',
    referenceType: process.env.STUDENT_POINT_COMPETITION_SUBMIT_REFERENCE_TYPE || 'COMPETITION_SUBMIT',
    rules: parseCompetitionSubmitRules(),
  },
  attendance: {
    enabled: process.env.STUDENT_POINT_ATTENDANCE_ENABLED !== 'false',
    points: toNumber(process.env.STUDENT_POINT_ATTENDANCE_POINTS, 1),
    source: process.env.STUDENT_POINT_ATTENDANCE_SOURCE || 'ATTENDANCE',
    referenceType: process.env.STUDENT_POINT_ATTENDANCE_REFERENCE_TYPE || 'ATTENDANCE',
    eligibleStatuses: parseCsv(process.env.STUDENT_POINT_ATTENDANCE_ELIGIBLE_STATUSES, [
      'PRESENT',
      'LATE',
      'MAKEUP',
    ]),
  },
  learningItemLearned: {
    enabled: process.env.STUDENT_POINT_LEARNING_ITEM_LEARNED_ENABLED !== 'false',
    points: toNumber(process.env.STUDENT_POINT_LEARNING_ITEM_LEARNED_POINTS, 1),
    source: process.env.STUDENT_POINT_LEARNING_ITEM_LEARNED_SOURCE || 'LEARNING_ITEM_LEARNED',
    referenceType: process.env.STUDENT_POINT_LEARNING_ITEM_LEARNED_REFERENCE_TYPE || 'LEARNING_ITEM',
  },
  defaultPointCapPerAction: toNumber(process.env.STUDENT_POINT_DEFAULT_CAP_PER_ACTION, 100),
}
