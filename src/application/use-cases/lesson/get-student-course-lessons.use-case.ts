// src/application/use-cases/lesson/get-student-course-lessons.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository, ILessonRepository } from '../../../domain/repositories'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import type { IStudentLearningItemRepository } from '../../../domain/repositories/student-learning-item.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLessonResponseDto } from '../../dtos/lesson/student-lesson.dto'
import { ConflictException, ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CourseType, CourseVisibility } from 'src/shared/enums'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

@Injectable()
export class GetStudentCourseLessonsUseCase {
  constructor(
    @Inject('ILessonRepository')
    private readonly lessonRepository: ILessonRepository,
    @Inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    @Inject('IStudentLearningItemRepository')
    private readonly studentLearningItemRepository: IStudentLearningItemRepository,
    private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
  ) {}

  async execute(courseId: number, studentId: number): Promise<BaseResponseDto<StudentLessonResponseDto[]>> {
    const course = await this.courseRepository.findById(courseId)

    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc')
    }

    if (course.visibility === CourseVisibility.DRAFT) {
      throw new ConflictException('Khoa hoc nay chua duoc cong bo')
    }

    const enrollment = await this.courseEnrollmentRepository.findByCourseAndStudent(courseId, studentId)
    const isActiveEnrollment = Boolean(enrollment?.isActive())
    const canPreviewOnlineCourse =
      course.visibility === CourseVisibility.PUBLISHED &&
      [CourseType.ONLINE, CourseType.ALL].includes(course.courseType)

    if (!isActiveEnrollment && !canPreviewOnlineCourse) {
      throw new ForbiddenException('Ban chua dang ky khoa hoc nay')
    }

    const publicLessons = await this.lessonRepository.findByCourseForStudent(courseId)
    const lessons = await this.filterLessonsForStudentClass(publicLessons, courseId, studentId)

    const learningItemIds: number[] = []
    lessons.forEach((lesson) => {
      lesson.learningItems?.forEach((li) => {
        if (li.learningItem?.learningItemId) {
          learningItemIds.push(li.learningItem.learningItemId)
        }
      })
    })

    const studentLearningItemsList =
      learningItemIds.length > 0
        ? await this.studentLearningItemRepository.findByStudentAndItems(studentId, learningItemIds)
        : []

    const studentLearningItemsMap = new Map(studentLearningItemsList.map((sli) => [sli.learningItemId, sli]))

    return {
      success: true,
      message: 'Lay danh sach bai hoc thanh cong',
      data: StudentLessonResponseDto.fromEntities(lessons, studentLearningItemsMap),
    }
  }

  private async filterLessonsForStudentClass(lessons: any[], courseId: number, studentId: number): Promise<any[]> {
    const lessonOrderMap = await this.studentClassLessonAccessService.getVisibleLessonOrderMap(courseId, studentId)

    return lessons
      .filter((lesson) => lessonOrderMap.has(lesson.lessonId))
      .sort((a, b) => {
        const orderA = lessonOrderMap.get(a.lessonId) ?? a.orderInCourse
        const orderB = lessonOrderMap.get(b.lessonId) ?? b.orderInCourse
        return orderA - orderB || a.orderInCourse - b.orderInCourse
      })
  }
}
