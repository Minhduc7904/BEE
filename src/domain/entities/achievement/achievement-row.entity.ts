export class AchievementRowEntity {
  achievementRowId: number
  achievementBoardId: number
  studentName: string
  schoolName: string | null
  grade: number | null
  score: number | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    achievementRowId: number
    achievementBoardId: number
    studentName: string
    schoolName: string | null
    grade: number | null
    score: number | null
    sortOrder: number
    createdAt: Date
    updatedAt: Date
  }) {
    Object.assign(this, data)
  }
}
