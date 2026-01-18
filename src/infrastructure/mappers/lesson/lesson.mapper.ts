// src/infrastructure/mappers/lesson.mapper.ts
import { Lesson, Course, Admin } from '../../../domain/entities'
import { CourseMapper } from '../course/course.mapper'
import { AdminMapper } from '../user/admin.mapper'
import { LearningItemMapper } from '../learning-item/learning-item.mapper'
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
            visibility: prismaLesson.visibility,
            orderInCourse: prismaLesson.orderInCourse,
            allowTrial: prismaLesson.allowTrial ?? false,
            createdAt: prismaLesson.createdAt,
            updatedAt: prismaLesson.updatedAt,
            description: prismaLesson.description ?? undefined,
            teacherId: prismaLesson.teacherId ?? undefined,
            course: prismaLesson.course ? CourseMapper.toDomainCourse(prismaLesson.course) : undefined,
            teacher: prismaLesson.teacher ? AdminMapper.toDomainAdmin(prismaLesson.teacher) : undefined,
            learningItems: prismaLesson.learningItems ? prismaLesson.learningItems.map(LearningItemMapper.toDomainLearningItem) : undefined,
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
