// src/application/use-cases/learningItem/get-student-homeworks.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILearningItemRepository } from 'src/domain/repositories/learning-item.repository'
import type { IStudentLearningItemRepository } from 'src/domain/repositories/student-learning-item.repository'
import { StudentHomeworkQueryDto, HomeworkStatus } from '../../dtos/learningItem/student-homework-query.dto'
import {
    StudentHomeworkResponseDto,
    StudentHomeworkListResponseDto,
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

        // Build where clause
        const where: any = {
            type: LearningItemType.HOMEWORK,
        }

        // Search by title/description
        if (query.search) {
            where.OR = [
                { title: { contains: query.search } },
                { description: { contains: query.search } },
            ]
        }

        // Filter by course or lesson
        if (query.courseId || query.lessonId) {
            where.lessons = {
                some: {
                    ...(query.lessonId ? { lessonId: query.lessonId } : {}),
                    ...(query.courseId ? { lesson: { courseId: query.courseId } } : {}),
                },
            }
        }

        // Get all homework learning items
        const [learningItems, total] = await Promise.all([
            this.prisma.learningItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    homeworkContents: true,
                    studentLearningItems: {
                        where: { studentId },
                    },
                    lessons: {
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

        // Get homework submits for this student
        const learningItemIds = learningItems.map((item) => item.learningItemId)
        const homeworkContentIds = learningItems
            .flatMap((item) => item.homeworkContents)
            .map((hc) => hc.homeworkContentId)

        const homeworkSubmits = await this.prisma.homeworkSubmit.findMany({
            where: {
                studentId,
                homeworkContentId: { in: homeworkContentIds },
            },
        })

        // Map to response DTOs
        let homeworkDtos = learningItems.map((item) => {
            const homeworkContent = item.homeworkContents?.[0]
            const studentLearningItem = item.studentLearningItems?.[0]
            const lesson = item.lessons?.[0]?.lesson
            const homeworkSubmit = homeworkSubmits.find(
                (hs) => hs.homeworkContentId === homeworkContent?.homeworkContentId,
            )

            return new StudentHomeworkResponseDto({
                learningItem: item as any,
                homeworkContent,
                studentLearningItem,
                homeworkSubmit,
                lesson,
            })
        })

        // Filter by status
        if (query.status && query.status !== HomeworkStatus.ALL) {
            homeworkDtos = homeworkDtos.filter((hw) => {
                switch (query.status) {
                    case HomeworkStatus.INCOMPLETE:
                        return !hw.isLearned
                    case HomeworkStatus.COMPLETED:
                        return hw.isLearned
                    case HomeworkStatus.OVERDUE:
                        return hw.isOverdue
                    default:
                        return true
                }
            })
        }

        return new StudentHomeworkListResponseDto(
            homeworkDtos,
            page,
            limit,
            homeworkDtos.length, // Note: This is approximate when filtering by status
        )
    }
}
