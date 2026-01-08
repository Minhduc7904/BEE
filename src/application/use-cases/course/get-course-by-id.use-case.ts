// src/application/use-cases/course/get-course-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetCourseByIdUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository
    ) { }
    
  async execute(courseId: number): Promise<BaseResponseDto<CourseResponseDto>> {
    const course = await this.courseRepository.findById(courseId)

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học')
    }

    const courseResponse = CourseResponseDto.fromEntity(course)

    return {
      success: true,
      message: 'Lấy thông tin khóa học thành công',
      data: courseResponse,
    }
  }
}

