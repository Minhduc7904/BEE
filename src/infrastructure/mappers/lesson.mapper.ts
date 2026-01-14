// src/infrastructure/mappers/lesson.mapper.ts
import { Lesson, Course, Admin } from '../../domain/entities'
import { CourseMapper } from './course.mapper'
import { AdminMapper } from './admin.mapper'

/**
 * Mapper class để convert từ Prisma Lesson models sang Domain Lesson entities
 */
export class LessonMapper {
    /**
     * Convert Prisma Lesson model sang Domain Lesson entity
     */
    static toDomainLesson(prismaLesson: any): Lesson | undefined {
        if (!prismaLesson) return undefined

        return new Lesson({
            lessonId: prismaLesson.lessonId,
            courseId: prismaLesson.courseId,
            title: prismaLesson.title,
            createdAt: prismaLesson.createdAt,
            updatedAt: prismaLesson.updatedAt,
            description: prismaLesson.description ?? undefined,
            teacherId: prismaLesson.teacherId ?? undefined,
            course: prismaLesson.course ? CourseMapper.toDomainCourse(prismaLesson.course) : undefined,
            teacher: prismaLesson.teacher ? AdminMapper.toDomainAdmin(prismaLesson.teacher) : undefined,
            learningItems: undefined, // Can be populated separately if needed
        })
    }

    /**
     * Convert array của Prisma Lessons sang array của Domain Lessons
     */
    static toDomainLessons(prismaLessons: any[]): Lesson[] {
        return prismaLessons
            .map((lesson) => this.toDomainLesson(lesson))
            .filter(Boolean) as Lesson[]
    }
}
