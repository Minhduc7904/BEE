import { Inject, Injectable } from '@nestjs/common';
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository';
import {
    CourseEnrollmentFilterOptions,
    CourseEnrollmentPaginationOptions,
} from 'src/domain/interface/course-enrollment/course-enrollment.interface';
import {
    CourseEnrollmentResponseDto,
    CourseEnrollmentListResponseDto,
} from '../../dtos/course-enrollment/course-enrollment.dto';
import { CourseEnrollmentListQueryDto } from '../../dtos/course-enrollment/course-enrollment-list-query.dto';
@Injectable()
export class GetAllCourseEnrollmentUseCase {
    constructor(
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    ) { }

    async execute(
        query: CourseEnrollmentListQueryDto,
    ): Promise<CourseEnrollmentListResponseDto> {
        const filterOptions: CourseEnrollmentFilterOptions = query.toCourseEnrollmentFilterOptions();
        const paginationOptions: CourseEnrollmentPaginationOptions = query.toCourseEnrollmentPaginationOptions();
        const { data, total } =
            await this.courseEnrollmentRepository.findAllWithPagination(
                paginationOptions,
                filterOptions,
            );

        const enrollmentDtos = data.map(
            (enrollment) => new CourseEnrollmentResponseDto(enrollment),
        );

        return new CourseEnrollmentListResponseDto(
            enrollmentDtos,
            paginationOptions.page,
            paginationOptions.limit,
            total,
        );
    }
}
