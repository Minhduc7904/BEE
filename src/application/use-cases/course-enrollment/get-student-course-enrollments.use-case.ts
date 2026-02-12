// src/application/use-cases/course-enrollment/get-student-course-enrollments.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository'
import type { IStudentLearningItemRepository } from 'src/domain/repositories/student-learning-item.repository'
import {
    CourseEnrollmentFilterOptions,
    CourseEnrollmentPaginationOptions,
} from 'src/domain/interface/course-enrollment/course-enrollment.interface'
import {
    CourseEnrollmentListResponseDto,
    StudentCourseEnrollmentResponseDto,
} from '../../dtos/course-enrollment/course-enrollment.dto'
import { CourseEnrollmentListQueryDto } from '../../dtos/course-enrollment/course-enrollment-list-query.dto'
import { CourseVisibility } from 'src/shared/enums'
import { ValidationException } from 'src/shared/exceptions/custom-exceptions'
@Injectable()
export class GetStudentCourseEnrollmentsUseCase {
    constructor(
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
    ) { }

    async execute(
        studentId: number,
        query: CourseEnrollmentListQueryDto,
    ): Promise<CourseEnrollmentListResponseDto> {
        // Force student filter
        if (!studentId) {
            throw new ValidationException('Student ID is required to get enrollments')
        }
        query.studentId = studentId

        const filterOptions: CourseEnrollmentFilterOptions = query.toCourseEnrollmentFilterOptions()
        // Exclude draft courses from repository query
        filterOptions.excludeVisibilities = [CourseVisibility.DRAFT]

        const paginationOptions: CourseEnrollmentPaginationOptions = query.toCourseEnrollmentPaginationOptions()

        const { data, total } =
            await this.courseEnrollmentRepository.findAllWithPagination(
                paginationOptions,
                filterOptions,
            )

        // Calculate completion percentage for each enrollment
        const enrollmentDtos = await Promise.all(
            data.map(async (enrollment) => {
                const completionPercentage = await this.calculateCompletionPercentage(
                    studentId,
                    enrollment.courseId,
                    enrollment.course,
                )

                return new StudentCourseEnrollmentResponseDto(enrollment, completionPercentage)
            }),
        )

        return new CourseEnrollmentListResponseDto(
            enrollmentDtos,
            paginationOptions.page,
            paginationOptions.limit,
            total,
        )
    }

    /**
     * Calculate completion percentage for a student in a course
     * Gets all lessons -> learning items -> checks student learning progress
     */
    private async calculateCompletionPercentage(
        studentId: number,
        courseId: number,
        course?: any,
    ): Promise<number> {
        try {
            // If course is not loaded with lessons, we cannot calculate
            if (!course || !course.lessons || course.lessons.length === 0) {
                return 0
            }

            // Get all learning item IDs from all lessons in the course
            const allLearningItemIds: number[] = []

            for (const lesson of course.lessons) {
                if (lesson.learningItems && lesson.learningItems.length > 0) {
                    for (const lessonLearningItem of lesson.learningItems) {
                        allLearningItemIds.push(lessonLearningItem.learningItemId)
                    }
                }
            }

            // If no learning items, completion is 100% (nothing to learn)
            if (allLearningItemIds.length === 0) {
                return 100
            }

            // Get student learning items for these learning items
            const studentLearningItems =
                await this.studentLearningItemRepository.findByStudentAndItems(
                    studentId,
                    allLearningItemIds,
                )

            // Count how many are learned
            const learnedCount = studentLearningItems.filter(
                (item) => item.isLearned === true,
            ).length

            // Calculate percentage
            const percentage = (learnedCount / allLearningItemIds.length) * 100

            return Math.round(percentage * 100) / 100 // Round to 2 decimal places
        } catch (error) {
            console.error('Error calculating completion percentage:', error)
            return 0
        }
    }
}
