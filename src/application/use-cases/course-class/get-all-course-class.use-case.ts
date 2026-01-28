import { Inject, Injectable } from '@nestjs/common';
import type { ICourseClassRepository } from 'src/domain/repositories/course-class.repository';
import {
    CourseClassListResponseDto,
    CourseClassResponseDto,
} from '../../dtos/course-class/course-class.dto';
import { CourseClassListQueryDto } from '../../dtos/course-class/course-class-list-query.dto';
import { CourseClassSearchQueryDto } from '../../dtos/course-class/course-class-search-query.dto';

@Injectable()
export class GetAllCourseClassUseCase {
    constructor(
        @Inject('ICourseClassRepository')
        private readonly courseClassRepository: ICourseClassRepository,
    ) { }

    async execute(
        query: CourseClassListQueryDto | CourseClassSearchQueryDto,
    ): Promise<CourseClassListResponseDto> {
        const filters = query.toCourseClassFilterOptions();
        const pagination = query.toCourseClassPaginationOptions();

        const result = await this.courseClassRepository.findAllWithPagination(
            pagination,
            filters,
        );

        const courseClassResponses = result.data.map(
            (courseClass) => new CourseClassResponseDto(courseClass),
        );

        return new CourseClassListResponseDto(
            courseClassResponses,
            result.page,
            result.limit,
            result.total,
        );
    }
}
