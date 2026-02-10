// src/application/use-cases/lesson/create-lesson.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { CreateLessonDto } from '../../dtos/lesson/create-lesson.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { LessonResponseDto } from '../../dtos/lesson/lesson.dto'

@Injectable()
export class CreateLessonUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository
    ) { }

    async execute(dto: CreateLessonDto): Promise<BaseResponseDto<LessonResponseDto>> {
        // Auto-calculate orderInCourse if not provided
        let orderInCourse = dto.orderInCourse

        if (orderInCourse === undefined || orderInCourse === null) {
            const existingLessons = await this.lessonRepository.findByCourse(dto.courseId)
            const maxOrder = existingLessons.reduce((max, lesson) => {
                return lesson.orderInCourse && lesson.orderInCourse > max ? lesson.orderInCourse : max
            }, 0)
            orderInCourse = maxOrder + 1
        }

        const createData = {
            courseId: dto.courseId,
            title: dto.title,
            description: dto.description,
            visibility: dto.visibility,
            orderInCourse,
            teacherId: dto.teacherId,
            allowTrial: dto.allowTrial,
            chapterIds: dto.chapterIds,
        }

        const lesson = await this.lessonRepository.create(createData)
        const lessonResponse = LessonResponseDto.fromEntity(lesson)

        return {
            success: true,
            message: 'Tạo bài học thành công',
            data: lessonResponse,
        }
    }
}
