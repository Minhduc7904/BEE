import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CourseEnrollmentStatus, Visibility } from '../../shared/enums'

@Injectable()
export class StudentClassLessonAccessService {
    constructor(private readonly prisma: PrismaService) { }

    async getVisibleLessonOrderMap(
        courseId: number,
        studentId: number,
    ): Promise<Map<number, number | null>> {
        const classIds = await this.getStudentClassIds(courseId, studentId)
        const now = new Date()

        const lessons = await this.prisma.lesson.findMany({
            where: {
                courseId,
                visibility: Visibility.PUBLISHED,
            },
            select: {
                lessonId: true,
                orderInCourse: true,
                classLessons: {
                    where: {
                        classId: { in: classIds },
                    },
                    select: {
                        classId: true,
                        displayOrder: true,
                        isVisible: true,
                        availableFrom: true,
                        availableUntil: true,
                    },
                },
            },
        })

        const lessonOrderMap = new Map<number, number | null>()
        for (const lesson of lessons) {
            if (this.canViewLessonByClassRecords(lesson.classLessons, classIds, now)) {
                lessonOrderMap.set(
                    lesson.lessonId,
                    this.getDisplayOrderFromClassRecords(lesson.classLessons, now),
                )
            }
        }

        return lessonOrderMap
    }

    async isLessonVisibleForStudent(
        lessonId: number,
        courseId: number,
        studentId: number,
    ): Promise<boolean> {
        const classIds = await this.getStudentClassIds(courseId, studentId)
        if (classIds.length === 0) {
            return true
        }

        const now = new Date()
        const classLessons = await this.prisma.courseClassLesson.findMany({
            where: {
                classId: { in: classIds },
                lessonId,
            },
            select: {
                classId: true,
                displayOrder: true,
                isVisible: true,
                availableFrom: true,
                availableUntil: true,
            },
        })

        return this.canViewLessonByClassRecords(classLessons, classIds, now)
    }

    async findAccessibleLessonForLearningItem(
        learningItemId: number,
        studentId: number,
    ): Promise<{ lessonId: number; courseId: number } | null> {
        const lessonLearningItems = await this.prisma.lessonLearningItem.findMany({
            where: {
                learningItemId,
                lesson: {
                    visibility: Visibility.PUBLISHED,
                    course: {
                        courseEnrollments: {
                            some: {
                                studentId,
                                status: CourseEnrollmentStatus.ACTIVE,
                            },
                        },
                    },
                },
            },
            select: {
                lessonId: true,
                lesson: {
                    select: {
                        courseId: true,
                    },
                },
            },
        })

        for (const item of lessonLearningItems) {
            const isVisible = await this.isLessonVisibleForStudent(
                item.lessonId,
                item.lesson.courseId,
                studentId,
            )

            if (isVisible) {
                return {
                    lessonId: item.lessonId,
                    courseId: item.lesson.courseId,
                }
            }
        }

        return null
    }

    async getLessonLearningItemAccessFilters(
        courseIds: number[],
        studentId: number,
    ): Promise<any[]> {
        const visibleLessonIds: number[] = []

        for (const courseId of courseIds) {
            const lessonOrderMap = await this.getVisibleLessonOrderMap(courseId, studentId)
            visibleLessonIds.push(...lessonOrderMap.keys())
        }

        const filters: any[] = []
        if (visibleLessonIds.length > 0) {
            filters.push({
                lessonId: { in: Array.from(new Set(visibleLessonIds)) },
            })
        }

        return filters
    }

    private canViewLessonByClassRecords(
        classLessons: Array<{
            classId: number
            isVisible: boolean
            availableFrom: Date | null
            availableUntil: Date | null
        }>,
        classIds: number[],
        now: Date,
    ): boolean {
        if (classIds.length === 0 || classLessons.length === 0) {
            return true
        }

        const configuredClassIds = new Set(classLessons.map((classLesson) => classLesson.classId))
        const hasClassWithoutConfig = classIds.some((classId) => !configuredClassIds.has(classId))
        if (hasClassWithoutConfig) {
            return true
        }

        return classLessons.some((classLesson) => this.isClassLessonActive(classLesson, now))
    }

    private isClassLessonActive(
        classLesson: {
            isVisible: boolean
            availableFrom: Date | null
            availableUntil: Date | null
        },
        now: Date,
    ): boolean {
        if (!classLesson.isVisible) {
            return false
        }

        if (classLesson.availableFrom && classLesson.availableFrom > now) {
            return false
        }

        if (classLesson.availableUntil && classLesson.availableUntil < now) {
            return false
        }

        return true
    }

    private getDisplayOrderFromClassRecords(
        classLessons: Array<{
            displayOrder: number | null
            isVisible: boolean
            availableFrom: Date | null
            availableUntil: Date | null
        }>,
        now: Date,
    ): number | null {
        const displayOrders = classLessons
            .filter((classLesson) => this.isClassLessonActive(classLesson, now))
            .map((classLesson) => classLesson.displayOrder)
            .filter((displayOrder): displayOrder is number => displayOrder !== null)

        if (displayOrders.length === 0) {
            return null
        }

        return Math.min(...displayOrders)
    }

    private async getStudentClassIds(courseId: number, studentId: number): Promise<number[]> {
        const classStudents = await this.prisma.classStudent.findMany({
            where: {
                studentId,
                courseClass: { courseId },
            },
            select: { classId: true },
        })

        return classStudents.map((classStudent) => classStudent.classId)
    }
}
