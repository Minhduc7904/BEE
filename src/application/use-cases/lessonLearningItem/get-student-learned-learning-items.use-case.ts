import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import { CourseEnrollmentStatus } from '../../../shared/enums'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'
import { StudentLearnedLearningItemsQueryDto } from '../../dtos/lessonLearningItem/student-learned-learning-items-query.dto'
import { StudentLearnedLearningItemResponseDto } from '../../dtos/lessonLearningItem/student-learned-learning-item.dto'
import { StudentClassLessonAccessService } from '../../services/student-class-lesson-access.service'

@Injectable()
export class GetStudentLearnedLearningItemsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
  ) {}

  async execute(
    studentId: number,
    query: StudentLearnedLearningItemsQueryDto,
  ): Promise<PaginationResponseDto<StudentLearnedLearningItemResponseDto>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const enrolledCourseIds = (await this.prisma.courseEnrollment.findMany({
      where: {
        studentId,
        status: CourseEnrollmentStatus.ACTIVE,
      },
      select: {
        courseId: true,
      },
    })).map((enrollment) => enrollment.courseId)

    if (enrolledCourseIds.length === 0) {
      return PaginationResponseDto.success('Lấy danh sách mục học tập đã học thành công', [], page, limit, 0)
    }

    const accessFilters = await this.studentClassLessonAccessService.getLessonLearningItemAccessFilters(
      enrolledCourseIds,
      studentId,
    )

    if (accessFilters.length === 0) {
      return PaginationResponseDto.success('Lấy danh sách mục học tập đã học thành công', [], page, limit, 0)
    }

    const lessonFilter = accessFilters.length === 1 ? accessFilters[0] : { OR: accessFilters }
    const where = {
      studentId,
      isLearned: true,
      learningItem: {
        lessons: {
          some: lessonFilter,
        },
      },
    }

    const [items, total] = await Promise.all([
      this.prisma.studentLearningItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { learnedAt: 'desc' },
          { updatedAt: 'desc' },
        ],
        include: {
          learningItem: {
            include: {
              lessons: {
                where: lessonFilter,
                include: {
                  lesson: {
                    select: {
                      lessonId: true,
                      title: true,
                      courseId: true,
                      course: {
                        select: {
                          code: true,
                          title: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.studentLearningItem.count({ where }),
    ])

    return PaginationResponseDto.success(
      'Lấy danh sách mục học tập đã học thành công',
      items.map((item) => StudentLearnedLearningItemResponseDto.fromPrisma(item)),
      page,
      limit,
      total,
    )
  }
}
