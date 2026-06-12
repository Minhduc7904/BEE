import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    StudentLessonLearningItemListResponseDto,
    StudentLessonLearningItemResponseDto,
} from '../../dtos/lessonLearningItem'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CourseEnrollmentStatus, Visibility } from '../../../shared/enums'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

@Injectable()
export class GetStudentLessonLearningItemsUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
    ) { }

    async execute(
        lessonId: number,
        studentId: number,
    ): Promise<StudentLessonLearningItemListResponseDto> {
        const accessibleLesson = await this.prisma.lesson.findFirst({
            where: {
                lessonId,
                visibility: Visibility.PUBLISHED,
                course: {
                    courseEnrollments: {
                        some: {
                            studentId,
                            status: CourseEnrollmentStatus.ACTIVE,
                        },
                    },
                },
            },
            select: {
                lessonId: true,
                courseId: true,
            },
        })

        if (!accessibleLesson) {
            throw new NotFoundException('Không tìm thấy bài học')
        }

        const canViewLesson = await this.studentClassLessonAccessService.isLessonVisibleForStudent(
            lessonId,
            accessibleLesson.courseId,
            studentId,
        )

        if (!canViewLesson) {
            throw new NotFoundException('Không tìm thấy bài học')
        }

        const lessonLearningItems = await this.prisma.lessonLearningItem.findMany({
            where: {
                lessonId,
                lesson: {
                    visibility: Visibility.PUBLISHED,
                    course: {
                        courseEnrollments: {
                            some: {
                                studentId,
                                status: CourseEnrollmentStatus.ACTIVE,
                            },
                        },
                    },
                },
            },
            include: {
                lesson: {
                    select: {
                        lessonId: true,
                        title: true,
                        courseId: true,
                    },
                },
                learningItem: {
                    include: {
                        studentLearningItems: {
                            where: { studentId },
                        },
                    },
                },
            },
            orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' },
            ],
        })

        return BaseResponseDto.success(
            'Lấy danh sách mục học tập của bài học thành công',
            lessonLearningItems.map((item) => StudentLessonLearningItemResponseDto.fromPrisma(item)),
        )
    }
}
