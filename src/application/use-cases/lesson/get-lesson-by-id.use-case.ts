// src/application/use-cases/lesson/get-lesson-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { LessonResponseDto } from '../../dtos/lesson/lesson.dto'
import { ConflictException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { LessonCourseClassLessonsService } from '../../services/lesson-course-class-lessons.service'

@Injectable()
export class GetLessonByIdUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository,
        private readonly lessonCourseClassLessonsService: LessonCourseClassLessonsService,
    ) { }

    async execute(id: number, courseId?: number): Promise<BaseResponseDto<LessonResponseDto>> {
        const lesson = await this.lessonRepository.findById(id)

        if (!lesson) {
            throw new NotFoundException('Bài học không tồn tại')
        }

        if (courseId !== undefined && courseId !== lesson.courseId) {
            throw new ConflictException('Khóa học truy vấn không khớp với bài học')
        }

        const lessonResponse = LessonResponseDto.fromEntity(lesson)
        lessonResponse.courseClassLessons = await this.lessonCourseClassLessonsService.getForLesson(id, courseId)

        return {
            success: true,
            message: 'Lấy thông tin bài học thành công',
            data: lessonResponse,
        }
    }
}
