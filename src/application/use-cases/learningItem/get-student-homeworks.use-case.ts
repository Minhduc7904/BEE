// src/application/use-cases/learningItem/get-student-homeworks.use-case.ts
import { Injectable } from '@nestjs/common'
import { StudentHomeworkQueryDto, HomeworkStatus } from '../../dtos/learningItem/student-homework-query.dto'
import {
  StudentHomeworkResponseDto,
  StudentHomeworkListResponseDto,
  HomeworkContentWithStatusDto,
  StudentHomeworkSubmitDto,
} from '../../dtos/learningItem/student-homework.dto'
import { CourseEnrollmentStatus, HomeworkContentType, LearningItemType } from 'src/shared/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'
import type { Prisma } from '@prisma/client'

@Injectable()
export class GetStudentHomeworksUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
  ) {}

  async execute(studentId: number, query: StudentHomeworkQueryDto): Promise<StudentHomeworkListResponseDto> {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'

    // 1. Lấy danh sách courseId mà student đang active enrollment
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        studentId,
        status: CourseEnrollmentStatus.ACTIVE,
      },
      select: { courseId: true },
    })
    const enrolledCourseIds = enrollments.map((e) => e.courseId)

    // Nếu chưa enroll khoá nào → trả về rỗng ngay
    if (enrolledCourseIds.length === 0) {
      return new StudentHomeworkListResponseDto([], page, limit, 0)
    }

    if (query.courseId && !enrolledCourseIds.includes(query.courseId)) {
      return new StudentHomeworkListResponseDto([], page, limit, 0)
    }

    if (query.courseId) {
      enrolledCourseIds.splice(0, enrolledCourseIds.length, query.courseId)
    }

    const lessonAccessFilters = await this.studentClassLessonAccessService.getLessonLearningItemAccessFilters(
      enrolledCourseIds,
      studentId,
    )

    if (lessonAccessFilters.length === 0) {
      return new StudentHomeworkListResponseDto([], page, limit, 0)
    }

    const classAccessLessonFilter: Prisma.LessonLearningItemWhereInput =
      lessonAccessFilters.length === 1 ? lessonAccessFilters[0] : { OR: lessonAccessFilters }

    // Ghép lessonId với filter class bằng AND để không thể ghi đè quyền xem qua class.
    const lessonFilter: Prisma.LessonLearningItemWhereInput = query.lessonId
      ? {
          AND: [classAccessLessonFilter, { lessonId: query.lessonId }],
        }
      : classAccessLessonFilter

    const where: Prisma.LearningItemWhereInput = {
      type: LearningItemType.HOMEWORK,
      lessons: { some: lessonFilter },
    }

    // Tìm kiếm theo tiêu đề / mô tả
    if (query.search) {
      where.OR = [{ title: { contains: query.search } }, { description: { contains: query.search } }]
    }

    const homeworkTypeFilter: Prisma.HomeworkContentWhereInput = query.homeworkType ? { type: query.homeworkType } : {}

    // INCOMPLETE/COMPLETED dựa vào sự tồn tại của HomeworkSubmit, không dựa vào isLearned.
    if (query.status === HomeworkStatus.COMPLETED) {
      where.homeworkContents = {
        some: {
          ...homeworkTypeFilter,
          homeworkSubmits: { some: { studentId } },
        },
      }
    } else if (query.status === HomeworkStatus.INCOMPLETE) {
      where.homeworkContents = {
        some: homeworkTypeFilter,
        none: {
          ...homeworkTypeFilter,
          homeworkSubmits: { some: { studentId } },
        },
      }
    } else if (query.status === HomeworkStatus.OVERDUE) {
      const now = new Date()
      const overdueConditions: Prisma.HomeworkContentWhereInput[] = []

      if (!query.homeworkType || query.homeworkType === HomeworkContentType.FILE_UPLOAD) {
        overdueConditions.push({
          type: HomeworkContentType.FILE_UPLOAD,
          dueDate: { lt: now },
        })
      }

      if (!query.homeworkType || query.homeworkType === HomeworkContentType.COMPETITION) {
        overdueConditions.push({
          type: HomeworkContentType.COMPETITION,
          OR: [
            { dueDate: { lt: now } },
            {
              competition: {
                is: {
                  endDate: { lt: now },
                },
              },
            },
          ],
        })
      }

      where.homeworkContents = {
        some: {
          OR: overdueConditions,
        },
      }
    } else if (query.homeworkType) {
      where.homeworkContents = {
        some: homeworkTypeFilter,
      }
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
            where: query.homeworkType ? { type: query.homeworkType } : undefined,
            include: {
              competition: true,
            },
          },
          studentLearningItems: {
            where: { studentId },
          },
          lessons: {
            where: {
              ...lessonFilter,
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
    const homeworkContentIds = learningItems.flatMap((item) => item.homeworkContents).map((hc) => hc.homeworkContentId)

    const homeworkSubmits = await this.prisma.homeworkSubmit.findMany({
      where: {
        studentId,
        homeworkContentId: { in: homeworkContentIds },
      },
    })

    const homeworkSubmitByContentId = new Map(homeworkSubmits.map((submit) => [submit.homeworkContentId, submit]))

    // 5. Map sang DTO
    const homeworkDtos = learningItems.map((item) => {
      const studentLearningItem = item.studentLearningItems?.[0]
      const lesson = item.lessons?.[0]?.lesson

      const homeworkContentsWithStatus = item.homeworkContents.map((hwContent) => {
        const homeworkSubmit = homeworkSubmitByContentId.get(hwContent.homeworkContentId)
        const homeworkSubmitDto = homeworkSubmit ? StudentHomeworkSubmitDto.fromPrisma(homeworkSubmit) : null

        return new HomeworkContentWithStatusDto({
          homeworkContent: hwContent,
          homeworkSubmit: homeworkSubmitDto,
        })
      })

      return new StudentHomeworkResponseDto({
        learningItem: item,
        homeworkContents: homeworkContentsWithStatus,
        studentLearningItem,
        lesson,
      })
    })

    return new StudentHomeworkListResponseDto(homeworkDtos, page, limit, total)
  }
}
