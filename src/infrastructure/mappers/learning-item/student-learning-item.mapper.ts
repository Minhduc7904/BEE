// src/infrastructure/mappers/learning-item/student-learning-item.mapper.ts
import { StudentLearningItem } from '../../../domain/entities'
import { StudentMapper } from '../user/student.mapper'

/**
 * Mapper class để convert từ Prisma StudentLearningItem model
 * sang Domain StudentLearningItem entity
 */
export class StudentLearningItemMapper {
    /**
     * Convert Prisma StudentLearningItem model sang Domain StudentLearningItem entity
     */
    static toDomainStudentLearningItem(
        prismaStudentLearningItem: any,
    ): StudentLearningItem | undefined {
        if (!prismaStudentLearningItem) return undefined

        return new StudentLearningItem({
            studentId: prismaStudentLearningItem.studentId,
            learningItemId: prismaStudentLearningItem.learningItemId,
            isLearned: prismaStudentLearningItem.isLearned,
            learnedAt: prismaStudentLearningItem.learnedAt ?? undefined,
            createdAt: prismaStudentLearningItem.createdAt,
            updatedAt: prismaStudentLearningItem.updatedAt,

            // Relations
            student: prismaStudentLearningItem.student
                ? StudentMapper.toDomainStudent(prismaStudentLearningItem.student)
                : undefined,

            // Không map learningItem để tránh circular reference
            // learningItem sẽ được set từ parent context nếu cần
        })
    }

    /**
     * Convert array Prisma StudentLearningItems sang array Domain StudentLearningItems
     */
    static toDomainStudentLearningItems(
        prismaStudentLearningItems: any[],
    ): StudentLearningItem[] {
        return prismaStudentLearningItems
            .map((item) => this.toDomainStudentLearningItem(item))
            .filter(Boolean) as StudentLearningItem[]
    }
}
