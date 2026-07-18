import { Inject, Injectable } from '@nestjs/common'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import { PaginationResponseDto } from '../../dtos/pagination/pagination-response.dto'
import { StudentLatestLessonsQueryDto } from '../../dtos/lesson/student-latest-lessons-query.dto'
import { StudentLessonResponseDto } from '../../dtos/lesson/student-lesson.dto'
import { GetStudentCourseLessonsUseCase } from './get-student-course-lessons.use-case'

@Injectable()
export class GetStudentLatestLessonsUseCase {
  constructor(
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    private readonly getStudentCourseLessonsUseCase: GetStudentCourseLessonsUseCase,
  ) {}

  async execute(
    studentId: number,
    query: StudentLatestLessonsQueryDto,
  ): Promise<PaginationResponseDto<StudentLessonResponseDto>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const activeEnrollments = (await this.courseEnrollmentRepository.findByStudent(studentId))
      .filter((enrollment) => enrollment.isActive())

    if (activeEnrollments.length === 0) {
      return PaginationResponseDto.success('Lấy danh sách bài học mới nhất thành công', [], page, limit, 0)
    }

    const lessonResponses = await Promise.all(
      activeEnrollments.map((enrollment) =>
        this.getStudentCourseLessonsUseCase.execute(enrollment.courseId, studentId),
      ),
    )

    const lessons = lessonResponses
      .flatMap((response) => response.data ?? [])
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.updatedAt.getTime() - a.updatedAt.getTime())

    const total = lessons.length
    const start = (page - 1) * limit

    return PaginationResponseDto.success(
      'Lấy danh sách bài học mới nhất thành công',
      lessons.slice(start, start + limit),
      page,
      limit,
      total,
    )
  }
}
