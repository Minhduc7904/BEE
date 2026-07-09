// src/application/use-cases/course/get-course-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { attachMediaToCourseResponse } from './course-media.helper'
import { MinioService } from '../../../infrastructure/services/minio.service'

@Injectable()
export class GetCourseByIdUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }
    
  async execute(courseId: number): Promise<BaseResponseDto<CourseResponseDto>> {
    const course = await this.courseRepository.findById(courseId)

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học')
    }

    const courseResponse = CourseResponseDto.fromEntity(course)
    await attachMediaToCourseResponse(courseResponse, this.mediaUsageRepository, this.minioService)

    return {
      success: true,
      message: 'Lấy thông tin khóa học thành công',
      data: courseResponse,
    }
  }
}

