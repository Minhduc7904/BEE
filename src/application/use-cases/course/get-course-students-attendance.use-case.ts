// src/application/use-cases/course/get-course-students-attendance.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CourseStudentsAttendanceQueryDto } from '../../dtos/course/course-students-attendance-query.dto'
import {
    CourseStudentsAttendanceListResponseDto,
    StudentAttendanceDto,
} from '../../dtos/course/course-student-attendance.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

/**
 * Get students with attendance records for a course
 * 
 * BUSINESS RULES:
 * - Must provide date range (fromDate, toDate) - mandatory
 * - Returns students enrolled in the course
 * - Each student includes their attendance records within the date range
 * - Attendance statistics are calculated (present, absent, late, makeup)
 * - Supports pagination and search
 */
@Injectable()
export class GetCourseStudentsAttendanceUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository
    ) { }

    async execute(
        courseId: number,
        query: CourseStudentsAttendanceQueryDto
    ): Promise<CourseStudentsAttendanceListResponseDto> {
        // 1. Verify course exists
        const course = await this.courseRepository.findById(courseId)
        if (!course) {
            throw new NotFoundException(`Khóa học với ID ${courseId} không tồn tại`)
        }

        // 2. Get filters and pagination options
        const filters = query.toFilterOptions()
        const pagination = query.toPaginationOptions()

        // 3. Fetch students with attendance
        const result = await this.courseRepository.findStudentsWithAttendance(
            courseId,
            filters,
            pagination
        )

        // 4. Map to DTOs
        const studentAttendanceDtos = result.students.map(item =>
            StudentAttendanceDto.fromEntity(item.student, item.attendances)
        )

        // 5. Return paginated response
        return new CourseStudentsAttendanceListResponseDto(
            studentAttendanceDtos,
            result.page,
            result.limit,
            result.total
        )
    }
}
