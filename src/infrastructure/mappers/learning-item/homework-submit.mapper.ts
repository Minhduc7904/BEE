// src/infrastructure/mappers/homework-submit.mapper.ts
import { HomeworkSubmit } from '../../../domain/entities'
import { HomeworkContentMapper } from './homework-content.mapper'
import { StudentMapper } from '../user/student.mapper'
import { AdminMapper } from '../user/admin.mapper'

/**
 * Mapper class để convert từ Prisma HomeworkSubmit model
 * sang Domain HomeworkSubmit entity
 */
export class HomeworkSubmitMapper {
    /**
     * Convert Prisma HomeworkSubmit model sang Domain HomeworkSubmit entity
     */
    static toDomainHomeworkSubmit(prismaHomeworkSubmit: any): HomeworkSubmit | undefined {
        if (!prismaHomeworkSubmit) return undefined

        return new HomeworkSubmit({
            homeworkSubmitId: prismaHomeworkSubmit.homeworkSubmitId,
            homeworkContentId: prismaHomeworkSubmit.homeworkContentId,
            studentId: prismaHomeworkSubmit.studentId,
            submitAt: prismaHomeworkSubmit.submitAt,
            content: prismaHomeworkSubmit.content,
            points: prismaHomeworkSubmit.points ?? undefined,
            gradedAt: prismaHomeworkSubmit.gradedAt ?? undefined,
            graderId: prismaHomeworkSubmit.graderId ?? undefined,
            feedback: prismaHomeworkSubmit.feedback ?? undefined,
            createdAt: prismaHomeworkSubmit.createdAt,
            updatedAt: prismaHomeworkSubmit.updatedAt,

            // Relations
            homeworkContent: prismaHomeworkSubmit.homeworkContent
                ? HomeworkContentMapper.toDomainHomeworkContent(
                    prismaHomeworkSubmit.homeworkContent,
                )
                : undefined,

            student: prismaHomeworkSubmit.student
                ? StudentMapper.toDomainStudent(prismaHomeworkSubmit.student)
                : undefined,

            grader: prismaHomeworkSubmit.grader
                ? AdminMapper.toDomainAdmin(prismaHomeworkSubmit.grader)
                : undefined,
        })
    }

    /**
     * Convert array Prisma HomeworkSubmits sang array Domain HomeworkSubmits
     */
    static toDomainHomeworkSubmits(prismaHomeworkSubmits: any[]): HomeworkSubmit[] {
        return prismaHomeworkSubmits
            .map((item) => this.toDomainHomeworkSubmit(item))
            .filter(Boolean) as HomeworkSubmit[]
    }
}
