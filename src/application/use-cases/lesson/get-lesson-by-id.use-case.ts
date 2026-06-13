// src/application/use-cases/lesson/get-lesson-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import {
    LessonCourseClassLessonResponseDto,
    LessonResponseDto,
} from '../../dtos/lesson/lesson.dto'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class GetLessonByIdUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(id: number, courseId?: number): Promise<BaseResponseDto<LessonResponseDto>> {
        const lesson = await this.lessonRepository.findById(id)

        if (!lesson) {
            throw new NotFoundException('Bài học không tồn tại')
        }

        const lessonResponse = LessonResponseDto.fromEntity(lesson)
        lessonResponse.courseClassLessons = await this.getCourseClassLessons(id, lesson.courseId, courseId)

        return {
            success: true,
            message: 'Lấy thông tin bài học thành công',
            data: lessonResponse,
        }
    }

    private async getCourseClassLessons(
        lessonId: number,
        lessonCourseId: number,
        courseId?: number,
    ): Promise<LessonCourseClassLessonResponseDto[]> {
        if (courseId === undefined) {
            const courseClassLessons = await this.prisma.courseClassLesson.findMany({
                where: { lessonId },
                include: {
                    courseClass: true,
                },
                orderBy: [
                    { courseClass: { courseId: 'asc' } },
                    { classId: 'asc' },
                ],
            })

            return courseClassLessons.map((courseClassLesson) =>
                LessonCourseClassLessonResponseDto.fromPrisma(courseClassLesson),
            )
        }

        if (courseId !== lessonCourseId) {
            throw new ConflictException('Khóa học truy vấn không khớp với bài học')
        }

        const [courseClasses, courseClassLessons] = await Promise.all([
            this.prisma.courseClass.findMany({
                where: { courseId },
                orderBy: [
                    { startDate: 'asc' },
                    { classId: 'asc' },
                ],
            }),
            this.prisma.courseClassLesson.findMany({
                where: {
                    lessonId,
                    courseClass: {
                        courseId,
                    },
                },
                include: {
                    courseClass: true,
                },
            }),
        ])

        const lessonByClassId = new Map(
            courseClassLessons.map((courseClassLesson) => [courseClassLesson.classId, courseClassLesson]),
        )

        return courseClasses.map((courseClass) => {
            const existing = lessonByClassId.get(courseClass.classId)
            return existing
                ? LessonCourseClassLessonResponseDto.fromPrisma(existing)
                : LessonCourseClassLessonResponseDto.baseFromCourseClass(courseClass, lessonId)
        })
    }
}
