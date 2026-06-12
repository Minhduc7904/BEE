import { Injectable } from '@nestjs/common'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { StudentLearningItemStateResponseDto } from '../../dtos/studentLearningItem'
import { PrismaService } from '../../../prisma/prisma.service'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { CourseEnrollmentStatus, Visibility } from '../../../shared/enums'

@Injectable()
export class MarkStudentLearningItemLearnedUseCase {
    constructor(private readonly prisma: PrismaService) { }

    async execute(
        studentId: number,
        learningItemId: number,
    ): Promise<BaseResponseDto<StudentLearningItemStateResponseDto>> {
        const accessibleLessonLearningItem = await this.prisma.lessonLearningItem.findFirst({
            where: {
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
            select: {
                lessonId: true,
                learningItemId: true,
            },
        })

        if (!accessibleLessonLearningItem) {
            throw new NotFoundException('Không tìm thấy mục học tập')
        }

        const existing = await this.prisma.studentLearningItem.findUnique({
            where: {
                studentId_learningItemId: {
                    studentId,
                    learningItemId,
                },
            },
        })

        const studentLearningItem = existing
            ? await this.prisma.studentLearningItem.update({
                where: {
                    studentId_learningItemId: {
                        studentId,
                        learningItemId,
                    },
                },
                data: {
                    isLearned: true,
                    learnedAt: existing.learnedAt ?? new Date(),
                },
            })
            : await this.prisma.studentLearningItem.create({
                data: {
                    studentId,
                    learningItemId,
                    isLearned: true,
                    learnedAt: new Date(),
                },
            })

        return BaseResponseDto.success(
            'Đánh dấu đã học mục học tập thành công',
            StudentLearningItemStateResponseDto.fromPrisma(studentLearningItem)!,
        )
    }
}
