// src/application/use-cases/learningItem/get-student-homeworks.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILearningItemRepository } from 'src/domain/repositories/learning-item.repository'
import type { IStudentLearningItemRepository } from 'src/domain/repositories/student-learning-item.repository'
import { StudentHomeworkQueryDto, HomeworkStatus } from '../../dtos/learningItem/student-homework-query.dto'
import {
    StudentHomeworkResponseDto,
    StudentHomeworkListResponseDto,
    HomeworkContentWithStatusDto,
} from '../../dtos/learningItem/student-homework.dto'
import { LearningItemType } from 'src/shared/enums'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class GetStudentHomeworksUseCase {
    constructor(
        @Inject('ILearningItemRepository')
        private readonly learningItemRepository: ILearningItemRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(
        studentId: number,
        query: StudentHomeworkQueryDto,
    ): Promise<StudentHomeworkListResponseDto> {
        const page = query.page || 1
        const limit = query.limit || 10
        const skip = (page - 1) * limit
        const sortBy = query.sortBy || 'createdAt'
        const sortOrder = query.sortOrder || 'desc'

        // 1. Lấy danh sách courseId mà student đã enroll
        const enrollments = await this.prisma.courseEnrollment.findMany({
            where: { studentId },
            select: { courseId: true },
        })
        const enrolledCourseIds = enrollments.map((e) => e.courseId)

        // Nếu chưa enroll khoá nào → trả về rỗng ngay
        if (enrolledCourseIds.length === 0) {
            return new StudentHomeworkListResponseDto([], page, limit, 0)
        }

        // 2. Build where clause — chỉ lấy learningItem thuộc lesson trong khoá đã enroll
        const lessonFilter: any = {
            lesson: {
                courseId: { in: enrolledCourseIds },
            },
        }

        // Thu hẹp thêm nếu client truyền courseId hoặc lessonId
        if (query.lessonId) {
            lessonFilter.lessonId = query.lessonId
        }
        if (query.courseId) {
            lessonFilter.lesson = {
                ...lessonFilter.lesson,
                courseId: query.courseId, // override in → exact match
            }
        }

        const where: any = {
            type: LearningItemType.HOMEWORK,
            lessons: { some: lessonFilter },
        }

        // Tìm kiếm theo tiêu đề / mô tả
        if (query.search) {
            where.OR = [
                { title: { contains: query.search } },
                { description: { contains: query.search } },
            ]
        }

        // 3. Query
        const [learningItems, total] = await Promise.all([
            this.prisma.learningItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    homeworkContents: {
                        include: {
                            competition: true,
                        },
                    },
                    studentLearningItems: {
                        where: { studentId },
                    },
                    lessons: {
                        where: {
                            lesson: { courseId: { in: enrolledCourseIds } },
                        },
                        include: {
                            lesson: {
                                select: {
                                    lessonId: true,
                                    title: true,
                                    courseId: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.learningItem.count({ where }),
        ])

        // 4. Lấy homeworkSubmits của student cho tất cả homeworkContent tìm được
        const homeworkContentIds = learningItems
            .flatMap((item) => item.homeworkContents)
            .map((hc) => hc.homeworkContentId)

        const homeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            where: {
                studentId,
                homeworkContentId: { in: homeworkContentIds },
            },
        })

        // 5. Map sang DTO
        let homeworkDtos = learningItems.map((item) => {
            const studentLearningItem = item.studentLearningItems?.[0]
            const lesson = item.lessons?.[0]?.lesson

            const homeworkContentsWithStatus = item.homeworkContents.map((hwContent) => {
                const homeworkSubmit = homeworkSubmits.find(
                    (hs) => hs.homeworkContentId === hwContent.homeworkContentId,
                )
                return new HomeworkContentWithStatusDto({
                    homeworkContent: hwContent,
                    homeworkSubmit,
                })
            })

            return new StudentHomeworkResponseDto({
                learningItem: item as any,
                homeworkContents: homeworkContentsWithStatus,
                studentLearningItem,
                lesson,
            })
        })

        // 6. Filter by status
        if (query.status && query.status !== HomeworkStatus.ALL) {
            homeworkDtos = homeworkDtos.filter((hw) => {
                switch (query.status) {
                    case HomeworkStatus.INCOMPLETE:
                        return !hw.isLearned
                    case HomeworkStatus.COMPLETED:
                        return hw.isLearned
                    case HomeworkStatus.OVERDUE:
                        return hw.homeworkContents.some((hc) => hc.isOverdue)
                    default:
                        return true
                }
            })
        }

        return new StudentHomeworkListResponseDto(
            homeworkDtos,
            page,
            limit,
            homeworkDtos.length,
        )
    }
}
