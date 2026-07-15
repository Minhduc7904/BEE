import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CourseListQueryDto } from '../../dtos/course/course-list-query.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../dtos/course/course.dto'
import type { CourseFilterOptions } from '../../../domain/interface'
import { CourseType, CourseVisibility } from 'src/shared/enums'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { attachThumbnailsToCourseResponses } from './course-media.helper'
import { MinioService } from '../../../infrastructure/services/minio.service'
import { PrismaService } from '../../../prisma/prisma.service'
import { getTeacherAvatarUrls } from './course-teacher-avatar.util'

@Injectable()
export class GetStudentAvailableOnlineCoursesUseCase {
  constructor(
    @Inject('ICourseRepository')
    private readonly courseRepository: ICourseRepository,
    @Inject('IMediaUsageRepository')
    private readonly mediaUsageRepository: IMediaUsageRepository,
    private readonly minioService: MinioService,
    private readonly prisma: PrismaService,
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
    const teacherUserIds = courseResponses
      .map((course) => course.teacher?.userId)
      .filter((userId): userId is number => userId !== undefined)

    const [, teacherAvatarUrlByUserId] = await Promise.all([
      attachThumbnailsToCourseResponses(courseResponses, this.mediaUsageRepository, this.minioService),
      getTeacherAvatarUrls(this.prisma, this.minioService, teacherUserIds),
    ])

    for (const course of courseResponses) {
      const teacherUserId = course.teacher?.userId
      const teacherAvatarUrl = teacherUserId
        ? teacherAvatarUrlByUserId.get(teacherUserId)
        : undefined

      course.teacherAvatarUrl = teacherAvatarUrl
      if (course.teacher) {
        course.teacher.avatarUrl = teacherAvatarUrl
      }
    }

    return new CourseListResponseDto(
      courseResponses,
      result.page,
      result.limit,
      result.total,
    )
  }
}
