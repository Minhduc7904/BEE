// src/application/use-cases/course/get-all-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CourseListQueryDto } from '../../dtos/course/course-list-query.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../dtos/course/course.dto'
import { CourseSearchQueryDto } from 'src/application/dtos/course/course-search-query.dto'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { attachThumbnailsToCourseResponses } from './course-media.helper'
import { MinioService } from '../../../infrastructure/services/minio.service'

@Injectable()
export class GetAllCourseUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(query: CourseListQueryDto | CourseSearchQueryDto): Promise<CourseListResponseDto> {
        const filters = query.toCourseFilterOptions()
        filters.isEnded ??= false
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
