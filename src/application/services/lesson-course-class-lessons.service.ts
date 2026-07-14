import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { LessonCourseClassLessonResponseDto } from '../dtos/lesson/lesson.dto'

@Injectable()
export class LessonCourseClassLessonsService {
    constructor(private readonly prisma: PrismaService) { }

    async getForLesson(
        lessonId: number,
        courseId?: number,
    ): Promise<LessonCourseClassLessonResponseDto[]> {
        const lessonMap = await this.getForLessons([lessonId], courseId)
        return lessonMap.get(lessonId) ?? []
    }

    async getForLessons(
        lessonIds: number[],
        courseId?: number,
    ): Promise<Map<number, LessonCourseClassLessonResponseDto[]>> {
        const uniqueLessonIds = Array.from(new Set(lessonIds))
        const result = new Map<number, LessonCourseClassLessonResponseDto[]>(
            uniqueLessonIds.map((lessonId) => [lessonId, []]),
        )

        if (uniqueLessonIds.length === 0) {
            return result
        }

        if (courseId === undefined) {
            const courseClassLessons = await this.prisma.courseClassLesson.findMany({
                where: {
                    lessonId: {
                        in: uniqueLessonIds,
                    },
                },
                include: {
                    courseClass: true,
                },
                orderBy: [
                    { courseClass: { courseId: 'asc' } },
                    { classId: 'asc' },
                ],
            })

            courseClassLessons.forEach((courseClassLesson) => {
                const lessonItems = result.get(courseClassLesson.lessonId) ?? []
                lessonItems.push(LessonCourseClassLessonResponseDto.fromPrisma(courseClassLesson))
                result.set(courseClassLesson.lessonId, lessonItems)
            })

            return result
        }

        const [courseClasses, courseClassLessons] = await Promise.all([
            this.prisma.courseClass.findMany({
                where: { courseId },
                orderBy: [
                    { startDate: 'asc' },
                    { classId: 'asc' },
                ],
            }),
            this.prisma.courseClassLesson.findMany({
                where: {
                    lessonId: {
                        in: uniqueLessonIds,
                    },
                    courseClass: {
                        courseId,
                    },
                },
                include: {
                    courseClass: true,
                },
            }),
        ])

        const lessonByClassKey = new Map(
            courseClassLessons.map((courseClassLesson) => [
                this.getLessonClassKey(courseClassLesson.lessonId, courseClassLesson.classId),
                courseClassLesson,
            ]),
        )

        uniqueLessonIds.forEach((lessonId) => {
            result.set(
                lessonId,
                courseClasses.map((courseClass) => {
                    const existing = lessonByClassKey.get(this.getLessonClassKey(lessonId, courseClass.classId))
                    return existing
                        ? LessonCourseClassLessonResponseDto.fromPrisma(existing)
                        : LessonCourseClassLessonResponseDto.baseFromCourseClass(courseClass, lessonId)
                }),
            )
        })

        return result
    }

    private getLessonClassKey(lessonId: number, classId: number): string {
        return `${lessonId}:${classId}`
    }
}
