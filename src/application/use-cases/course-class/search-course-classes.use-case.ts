// src/application/use-cases/course-class/search-course-classes.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseClassRepository } from '../../../domain/repositories/course-class.repository'
import {
    CourseClassListResponseDto,
    CourseClassResponseDto,
} from '../../dtos/course-class/course-class.dto'
import { CourseClassListQueryDto } from '../../dtos/course-class/course-class-list-query.dto'
import { CourseClassSearchQueryDto } from '../../dtos/course-class/course-class-search-query.dto'
import { PERMISSION_CODES } from '../../../shared/constants/permissions/permission.codes'

interface SearchContext {
    user?: {
        adminId?: number
        studentId?: number
        permissions?: string[]
    }
}

@Injectable()
export class SearchCourseClassesUseCase {
    constructor(
        @Inject('ICourseClassRepository')
        private readonly courseClassRepository: ICourseClassRepository,
    ) { }

    async execute(
        query: CourseClassListQueryDto | CourseClassSearchQueryDto,
        context?: SearchContext,
    ): Promise<CourseClassListResponseDto> {
        // Apply search filters based on user permissions
        const filters = this.buildFilters(query, context)
        const pagination = query.toCourseClassPaginationOptions()

        const result = await this.courseClassRepository.findAllWithPagination(
            pagination,
            filters,
        )

        const courseClassResponses = result.data.map(
            (courseClass) => new CourseClassResponseDto(courseClass),
        )

        return new CourseClassListResponseDto(
            courseClassResponses,
            result.page,
            result.limit,
            result.total,
        )
    }

    private buildFilters(query: CourseClassListQueryDto | CourseClassSearchQueryDto, context?: SearchContext): any {
        // Get base filters from query
        const filters = query.toCourseClassFilterOptions()

        const user = context?.user
        const permissions = user?.permissions ?? []

        // Case 1: No user or student user - return query filters as-is
        // Note: CourseClass doesn't have visibility, so no need to filter by it
        if (!user || user.studentId) {
            // Students can see classes they're enrolled in (handled at a different level)
            return filters
        }

        // Case 2: Admin with GET_ALL permission - no additional filters
        if (permissions.includes(PERMISSION_CODES.COURSE_CLASS.GET_ALL)) {
            return filters
        }

        // Case 3: Admin with GET_MY_CLASSES permission - only their classes
        if (permissions.includes(PERMISSION_CODES.COURSE_CLASS.GET_MY_CLASSES)) {
            // Filter by both instructorId and teacherId (course level)
            filters.instructorId = user.adminId
            filters.teacherId = user.adminId
            return filters
        }

        // Case 4: Default for other authenticated users - return empty filters
        // This means they won't see any classes (security default)
        return filters
    }
}
