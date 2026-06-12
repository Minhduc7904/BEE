import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CourseEnrollmentStatus, Visibility } from '../../shared/enums'

type ClassLessonAccessRecord = {
    classId: number
    displayOrder?: number | null
    isVisible: boolean
    availableFrom: Date | null
    availableUntil: Date | null
}

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
            const canView = this.canViewLessonByClassRecords(
                lesson.classLessons,
                classIds,
                now,
            )

            if (!canView) {
                continue
            }

            const classDisplayOrder = this.getDisplayOrderFromClassRecords(
                lesson.classLessons,
                now,
            )

            lessonOrderMap.set(
                lesson.lessonId,
                classDisplayOrder ?? lesson.orderInCourse ?? null,
            )
        }

        return lessonOrderMap
    }

    async isLessonVisibleForStudent(
        lessonId: number,
        courseId: number,
        studentId: number,
    ): Promise<boolean> {
        const classIds = await this.getStudentClassIds(courseId, studentId)

        /**
         * Nếu học sinh chưa được gán vào class nào trong course,
         * không khóa lesson theo classLesson.
         * => Hiện lesson bình thường.
         */
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

        const uniqueVisibleLessonIds = Array.from(new Set(visibleLessonIds))

        if (uniqueVisibleLessonIds.length === 0) {
            return []
        }

        return [
            {
                lessonId: { in: uniqueVisibleLessonIds },
            },
        ]
    }

    private canViewLessonByClassRecords(
        classLessons: ClassLessonAccessRecord[],
        classIds: number[],
        now: Date,
    ): boolean {
        /**
         * Không có classIds nghĩa là học sinh chưa được gán class trong course.
         * Rule mong muốn: vẫn hiện toàn bộ lesson published.
         */
        if (classIds.length === 0) {
            return true
        }

        /**
         * Không có bản ghi classLesson cho lesson này.
         * Rule mong muốn: vẫn hiện lesson.
         */
        if (classLessons.length === 0) {
            return true
        }

        /**
         * Nếu học sinh thuộc nhiều class, mà có ít nhất 1 class chưa config lesson,
         * thì không khóa lesson đó.
         *
         * Ví dụ:
         * - student ở class A, B
         * - lesson chỉ config cho class A
         * - class B chưa config
         * => vẫn hiện lesson.
         */
        const configuredClassIds = new Set(
            classLessons.map((classLesson) => classLesson.classId),
        )

        const hasClassWithoutConfig = classIds.some(
            (classId) => !configuredClassIds.has(classId),
        )

        if (hasClassWithoutConfig) {
            return true
        }

        /**
         * Chỉ khi tất cả class của học sinh đều đã có config,
         * lúc đó mới áp rule isVisible + availableFrom + availableUntil.
         */
        return classLessons.some((classLesson) =>
            this.isClassLessonActive(classLesson, now),
        )
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
        classLessons: ClassLessonAccessRecord[],
        now: Date,
    ): number | null {
        const displayOrders = classLessons
            .filter((classLesson) => this.isClassLessonActive(classLesson, now))
            .map((classLesson) => classLesson.displayOrder)
            .filter((displayOrder): displayOrder is number => displayOrder !== null && displayOrder !== undefined)

        if (displayOrders.length === 0) {
            return null
        }

        return Math.min(...displayOrders)
    }

    private async getStudentClassIds(
        courseId: number,
        studentId: number,
    ): Promise<number[]> {
        const classStudents = await this.prisma.classStudent.findMany({
            where: {
                studentId,
                courseClass: {
                    courseId,
                },
            },
            select: {
                classId: true,
            },
        })

        return classStudents.map((classStudent) => classStudent.classId)
    }
}