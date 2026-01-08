// src/infrastructure/mappers/class-session.mapper.ts
import { ClassSession } from '../../domain/entities/class-session/class-session.entity'
import { CourseClassMapper } from './course-class.mapper'

/**
 * Mapper class để convert từ Prisma ClassSession model
 * sang Domain ClassSession entity
 */
export class ClassSessionMapper {
    /**
     * Convert Prisma ClassSession sang Domain ClassSession
     */
    static toDomainClassSession(prismaSession: any): ClassSession | undefined {
        if (!prismaSession) return undefined

        return new ClassSession(
            prismaSession.sessionId,
            prismaSession.classId,
            prismaSession.sessionDate,
            prismaSession.startTime,
            prismaSession.endTime,
            prismaSession.createdAt ?? undefined,
            prismaSession.updatedAt ?? undefined,
            prismaSession.courseClass
                ? CourseClassMapper.toDomainCourseClass(prismaSession.courseClass)
                : undefined,
        )
    }

    /**
     * Convert array Prisma ClassSessions sang array Domain ClassSessions
     */
    static toDomainClassSessions(prismaSessions: any[]): ClassSession[] {
        return prismaSessions
            .map((session) => this.toDomainClassSession(session))
            .filter(Boolean) as ClassSession[]
    }
}
