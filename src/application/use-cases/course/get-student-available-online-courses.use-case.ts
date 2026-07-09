import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CourseListQueryDto } from '../../dtos/course/course-list-query.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../dtos/course/course.dto'
import type { CourseFilterOptions } from '../../../domain/interface'
import { CourseType, CourseVisibility } from 'src/shared/enums'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { attachThumbnailsToCourseResponses } from './course-media.helper'
import { MinioService } from '../../../infrastructure/services/minio.service'

@Injectable()
export class GetStudentAvailableOnlineCoursesUseCase {
  constructor(
    @Inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(query: CourseListQueryDto, studentId: number): Promise<CourseListResponseDto> {
    const filters: CourseFilterOptions = query.toCourseFilterOptions()
    filters.visibility = CourseVisibility.PUBLISHED
    filters.isEnded = false
    filters.courseType = undefined
    filters.courseTypes = [CourseType.ONLINE, CourseType.ALL]
    filters.excludeActiveEnrollmentStudentId = studentId

    const pagination = query.toCoursePaginationOptions()
    const result = await this.courseRepository.findAllWithPagination(pagination, filters)
    const courseResponses = CourseResponseDto.fromEntities(result.courses)
    await attachThumbnailsToCourseResponses(courseResponses, this.mediaUsageRepository, this.minioService)

    return new CourseListResponseDto(
      courseResponses,
      result.page,
      result.limit,
      result.total,
    )
  }
}
