// src/application/use-cases/course/get-all-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CourseListQueryDto } from '../../dtos/course/course-list-query.dto'
import { CourseListResponseDto, CourseResponseDto } from '../../dtos/course/course.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CourseVisibility } from '../../../shared/enums/course-visibility.enum'

@Injectable()
export class GetAllCourseUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository
    ) { }

    async execute(query: CourseListQueryDto): Promise<CourseListResponseDto> {
        const filters = query.toCourseFilterOptions()
        const pagination = query.toCoursePaginationOptions()

        const result = await this.courseRepository.findAllWithPagination(pagination, filters)

        const courseResponses = CourseResponseDto.fromEntities(result.courses)

        return new CourseListResponseDto(
            courseResponses,
            result.page,
            result.limit,
            result.total,
        )
    }
}
