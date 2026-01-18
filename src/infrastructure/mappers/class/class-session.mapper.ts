// src/infrastructure/mappers/class-session.mapper.ts

import { ClassSession } from '../../../domain/entities/class-session/class-session.entity'
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

        return new ClassSession({
            sessionId: prismaSession.sessionId,
            classId: prismaSession.classId,
            name: prismaSession.name,
            sessionDate: prismaSession.sessionDate,
            startTime: prismaSession.startTime,
            endTime: prismaSession.endTime,

            createdAt: prismaSession.createdAt ?? undefined,
            updatedAt: prismaSession.updatedAt ?? undefined,
            makeupNote: prismaSession.makeupNote ?? null,

            courseClass: prismaSession.courseClass
                ? CourseClassMapper.toDomainCourseClass(prismaSession.courseClass)
                : undefined,
        })
    }

    /**
     * Convert array Prisma ClassSessions sang array Domain ClassSessions
     */
    static toDomainClassSessions(prismaSessions: any[] | null | undefined): ClassSession[] {
        if (!prismaSessions || prismaSessions.length === 0) return []

        return prismaSessions
            .map((session) => this.toDomainClassSession(session))
            .filter(Boolean) as ClassSession[]
    }
}
