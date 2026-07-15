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
import { MediaStatus } from '@prisma/client'
import { PrismaService } from 'src/prisma/prisma.service'
import { MinioService } from 'src/infrastructure/services/minio.service'
import { EntityType } from 'src/shared/constants/entity-type.constants'
import { COURSE_MEDIA_FIELDS } from 'src/shared/constants'
import type { PublicSeoMediaFileDto } from '../../dtos/course/public-seo-course.dto'
import { mapPublicSeoMediaFile } from '../course/get-public-seo-online-courses.use-case'
import { getTeacherAvatarUrls } from '../course/course-teacher-avatar.util'
import type { CourseEnrollment } from 'src/domain/entities/course-enrollment/course-enrollment.entity'

@Injectable()
export class GetStudentCourseEnrollmentsUseCase {
    constructor(
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
        @Inject('IStudentLearningItemRepository')
        private readonly studentLearningItemRepository: IStudentLearningItemRepository,
        private readonly prisma: PrismaService,
        private readonly minioService: MinioService,
    ) { }

    async execute(
        studentId: number,
        query: CourseEnrollmentListQueryDto,
    ): Promise<CourseEnrollmentListResponseDto> {
        const filterOptions = this.buildStudentFilterOptions(studentId, query)
        const paginationOptions: CourseEnrollmentPaginationOptions = query.toCourseEnrollmentPaginationOptions()

        const { data, total } =
            await this.courseEnrollmentRepository.findAllWithPagination(
                paginationOptions,
                filterOptions,
            )

        const enrollmentDtos = await this.toStudentEnrollmentDtos(data, studentId)

        return new CourseEnrollmentListResponseDto(
            enrollmentDtos,
            paginationOptions.page,
            paginationOptions.limit,
            total,
        )
    }

    /**
     * Sắp xếp trên toàn bộ kết quả đã lọc trước khi phân trang vì
     * completionPercentage là dữ liệu tính toán, không phải cột trong database.
     */
    async executeSortedByProgress(
        studentId: number,
        query: CourseEnrollmentListQueryDto,
    ): Promise<CourseEnrollmentListResponseDto> {
        const filterOptions = this.buildStudentFilterOptions(studentId, query)
        const paginationOptions = query.toCourseEnrollmentPaginationOptions()
        const enrollments = await this.findAllMatchingEnrollments(filterOptions)
        const enrollmentDtos = await this.toStudentEnrollmentDtos(enrollments, studentId)
        const progressSortDirection = paginationOptions.sortOrder === 'asc' ? 1 : -1

        enrollmentDtos.sort((first, second) => {
            const progressDifference =
                first.completionPercentage - second.completionPercentage

            if (progressDifference !== 0) {
                return progressDifference * progressSortDirection
            }

            // Giữ thứ tự ổn định khi hai khóa học có cùng tiến độ.
            return second.enrolledAt.getTime() - first.enrolledAt.getTime()
        })

        const startIndex = (paginationOptions.page - 1) * paginationOptions.limit
        const paginatedDtos = enrollmentDtos.slice(
            startIndex,
            startIndex + paginationOptions.limit,
        )

        return new CourseEnrollmentListResponseDto(
            paginatedDtos,
            paginationOptions.page,
            paginationOptions.limit,
            enrollmentDtos.length,
        )
    }

    private buildStudentFilterOptions(
        studentId: number,
        query: CourseEnrollmentListQueryDto,
    ): CourseEnrollmentFilterOptions {
        if (!studentId) {
            throw new ValidationException('Student ID is required to get enrollments')
        }

        query.studentId = studentId
        const filterOptions = query.toCourseEnrollmentFilterOptions()
        filterOptions.excludeVisibilities = [CourseVisibility.DRAFT]

        return filterOptions
    }

    private async findAllMatchingEnrollments(
        filterOptions: CourseEnrollmentFilterOptions,
    ): Promise<CourseEnrollment[]> {
        const batchSize = 1000
        const enrollments: CourseEnrollment[] = []
        let page = 1
        let total = 0

        do {
            const result = await this.courseEnrollmentRepository.findAllWithPagination(
                {
                    page,
                    limit: batchSize,
                    sortBy: 'enrolledAt',
                    sortOrder: 'desc',
                },
                filterOptions,
            )

            total = result.total
            enrollments.push(...result.data)

            if (result.data.length === 0) {
                break
            }

            page += 1
        } while (enrollments.length < total)

        return enrollments
    }

    private async toStudentEnrollmentDtos(
        enrollments: CourseEnrollment[],
        studentId: number,
    ): Promise<StudentCourseEnrollmentResponseDto[]> {
        const teacherUserIds = enrollments
            .map((enrollment) => enrollment.course?.teacher?.userId ?? enrollment.course?.teacher?.user?.userId)
            .filter((userId): userId is number => userId !== undefined)

        const [thumbnailByCourseId, teacherAvatarUrlByUserId] = await Promise.all([
            this.getCourseThumbnails(enrollments.map((enrollment) => enrollment.courseId)),
            getTeacherAvatarUrls(this.prisma, this.minioService, teacherUserIds),
        ])

        return Promise.all(
            enrollments.map(async (enrollment) => {
                const completionPercentage = await this.calculateCompletionPercentage(
                    studentId,
                    enrollment.courseId,
                    enrollment.course,
                )

                return new StudentCourseEnrollmentResponseDto(
                    enrollment,
                    completionPercentage,
                    thumbnailByCourseId.get(enrollment.courseId),
                    teacherAvatarUrlByUserId.get(
                        enrollment.course?.teacher?.userId ?? enrollment.course?.teacher?.user?.userId ?? 0,
                    ),
                )
            }),
        )
    }

    private async getCourseThumbnails(
        courseIds: number[],
    ): Promise<Map<number, PublicSeoMediaFileDto>> {
        const thumbnailByCourseId = new Map<number, PublicSeoMediaFileDto>()

        if (courseIds.length === 0) {
            return thumbnailByCourseId
        }

        const usages = await this.prisma.mediaUsage.findMany({
            where: {
                entityType: EntityType.COURSE,
                entityId: {
                    in: [...new Set(courseIds)],
                },
                fieldName: COURSE_MEDIA_FIELDS.THUMBNAIL,
                media: {
                    status: MediaStatus.READY,
                },
            },
            include: {
                media: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        })

        for (const usage of usages) {
            thumbnailByCourseId.set(
                usage.entityId,
                await mapPublicSeoMediaFile(usage, this.minioService),
            )
        }

        return thumbnailByCourseId
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
