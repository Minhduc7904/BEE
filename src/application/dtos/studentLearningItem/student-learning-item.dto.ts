export class StudentLearningItemStateResponseDto {
    studentId: number
    learningItemId: number
    isLearned: boolean
    learnedAt?: Date
    createdAt: Date
    updatedAt: Date

    static fromPrisma(studentLearningItem: any): StudentLearningItemStateResponseDto | null {
        if (!studentLearningItem) {
            return null
        }

        const dto = new StudentLearningItemStateResponseDto()
        dto.studentId = studentLearningItem.studentId
        dto.learningItemId = studentLearningItem.learningItemId
        dto.isLearned = studentLearningItem.isLearned
        dto.learnedAt = studentLearningItem.learnedAt ?? undefined
        dto.createdAt = studentLearningItem.createdAt
        dto.updatedAt = studentLearningItem.updatedAt
        return dto
    }
}
