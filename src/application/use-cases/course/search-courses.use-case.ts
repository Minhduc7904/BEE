// src/application/use-cases/course/search-courses.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CourseListQueryDto } from '../../dtos/course/course-list-query.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../dtos/course/course.dto'
import { CourseSearchQueryDto } from '../../dtos/course/course-search-query.dto'
import { CourseVisibility } from '../../../shared/enums'
import { PERMISSION_CODES } from '../../../shared/constants/permissions/permission.codes'
import { CourseFilterOptions } from '../../../domain/interface/course/course.interface'
import type { IMediaUsageRepository } from '../../../domain/repositories/media-usage.repository'
import { attachThumbnailsToCourseResponses } from './course-media.helper'
import { MinioService } from '../../../infrastructure/services/minio.service'

interface SearchContext {
    user?: {
        adminId?: number
        studentId?: number
        permissions?: string[]
    }
}

@Injectable()
export class SearchCoursesUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository,
        @Inject('IMediaUsageRepository')
        private readonly mediaUsageRepository: IMediaUsageRepository,
        private readonly minioService: MinioService,
    ) { }

    async execute(query: CourseSearchQueryDto, context?: SearchContext): Promise<CourseListResponseDto> {
        // Apply search filters based on user permissions
        const filters = this.buildFilters(query, context)
        const pagination = query.toCoursePaginationOptions()

        const result = await this.courseRepository.findAllWithPagination(pagination, filters)
        // Filter out DRAFT courses (extra safety layer)
        const nonDraftCourses = result.courses.filter(
            course => course.visibility !== CourseVisibility.DRAFT
        )

        const courseResponses = CourseResponseDto.fromEntities(nonDraftCourses)
        await attachThumbnailsToCourseResponses(courseResponses, this.mediaUsageRepository, this.minioService)

        return new CourseListResponseDto(
            courseResponses,
            result.page,
            result.limit,
            nonDraftCourses.length
        )
    }

    private buildFilters(query: CourseSearchQueryDto, context?: SearchContext): CourseFilterOptions {
        // Get base filters from query
        const baseFilters = query.toCourseFilterOptions()

        const user = context?.user
        const permissions = user?.permissions ?? []
        const isAdmin = !!user?.adminId && !user?.studentId

        if (isAdmin) {
            return {
                ...baseFilters,
                isEnded: baseFilters.isEnded ?? false,
                visibility: undefined,
                teacherId: undefined,
                // excludeVisibility: CourseVisibility.DRAFT,
            }
        }

        // Case 1: No user or student user - only PUBLISHED courses
        // if (!user || user.studentId) {
        //     return {
        //         ...baseFilters,
        //         visibility: CourseVisibility.PUBLISHED,
        //         teacherId: undefined,
        //     }
        // }

        // Case 2: Admin with GET_ALL permission - PUBLISHED and PRIVATE (exclude DRAFT)
        // if (permissions.includes(PERMISSION_CODES.COURSE.GET_ALL)) {
            return {
                ...baseFilters,
                visibility: undefined,
                teacherId: undefined,
                // excludeVisibility: CourseVisibility.DRAFT,
            }
        // }

        // Case 3: Admin with GET_MY_COURSES permission - only their PUBLISHED and PRIVATE courses
        // if (permissions.includes(PERMISSION_CODES.COURSE.GET_MY_COURSES)) {
        //     return {
        //         ...baseFilters,
        //         visibility: undefined,
        //         teacherId: user.adminId,
        //         excludeVisibility: CourseVisibility.DRAFT,
        //     }
        // }

        // Case 4: Default for other authenticated users - only PUBLISHED
        // return {
        //     ...baseFilters,
        //     visibility: CourseVisibility.PUBLISHED,
        //     teacherId: undefined,
        // }
    }
}
