// src/application/use-cases/course/get-student-course-detail.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import type { ICourseEnrollmentRepository } from '../../../domain/repositories/course-enrollment.repository'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentCourseDetailResponseDto } from '../../dtos/course/student-course-detail.dto'
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { CourseType, CourseVisibility } from 'src/shared/enums'

@Injectable()
export class GetStudentCourseDetailUseCase {
  constructor(
    @Inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
  ) {}

  async execute(courseId: number, studentId: number): Promise<BaseResponseDto<StudentCourseDetailResponseDto>> {
    const course = await this.courseRepository.findById(courseId)

    if (!course) {
      throw new NotFoundException('Khong tim thay khoa hoc')
    }

    if (course.visibility === CourseVisibility.DRAFT) {
      throw new ConflictException('Khoa hoc nay chua duoc cong bo')
    }

    const enrollment = await this.courseEnrollmentRepository.findByCourseAndStudent(courseId, studentId)
    const isActiveEnrollment = Boolean(enrollment?.isActive())

    if (!isActiveEnrollment && course.courseType === CourseType.OFFLINE) {
      throw new ForbiddenException('Ban chua dang ky khoa hoc nay')
    }

    const courseResponse = StudentCourseDetailResponseDto.fromEntity(course, {
      isEnrolled: isActiveEnrollment,
      enrolledAt: isActiveEnrollment ? enrollment?.enrolledAt : undefined,
      status: isActiveEnrollment ? enrollment?.status : undefined,
      isPaidFull: isActiveEnrollment ? enrollment?.isPaidFull : undefined,
    })

    return {
      success: true,
      message: 'Lay thong tin khoa hoc thanh cong',
      data: courseResponse,
    }
  }
}
