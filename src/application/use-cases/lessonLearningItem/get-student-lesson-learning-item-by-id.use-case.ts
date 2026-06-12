import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLessonLearningItemResponseDto } from '../../dtos/lessonLearningItem'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CourseEnrollmentStatus, Visibility } from '../../../shared/enums'
import { StudentClassLessonAccessService } from 'src/application/services/student-class-lesson-access.service'

@Injectable()
export class GetStudentLessonLearningItemByIdUseCase {
    constructor(
        private readonly prisma: PrismaService,
        private readonly studentClassLessonAccessService: StudentClassLessonAccessService,
    ) { }

    async execute(
        lessonId: number,
        learningItemId: number,
        studentId: number,
    ): Promise<BaseResponseDto<StudentLessonLearningItemResponseDto>> {
        const lessonLearningItem = await this.prisma.lessonLearningItem.findFirst({
            where: {
                lessonId,
                learningItemId,
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
        })

        if (!lessonLearningItem) {
            throw new NotFoundException('Không tìm thấy mục học tập trong bài học')
        }

        const canViewLesson = await this.studentClassLessonAccessService.isLessonVisibleForStudent(
            lessonId,
            lessonLearningItem.lesson.courseId,
            studentId,
        )

        if (!canViewLesson) {
            throw new NotFoundException('Không tìm thấy mục học tập trong bài học')
        }

        return BaseResponseDto.success(
            'Lấy mục học tập của bài học thành công',
            StudentLessonLearningItemResponseDto.fromPrisma(lessonLearningItem),
        )
    }
}
