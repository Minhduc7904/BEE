// src/application/use-cases/lesson/update-lesson.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { UpdateLessonDto } from '../../dtos/lesson/update-lesson.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { LessonResponseDto } from '../../dtos/lesson/lesson.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateLessonUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository
    ) { }

    async execute(id: number, dto: UpdateLessonDto): Promise<BaseResponseDto<LessonResponseDto>> {
        // Check if lesson exists
        const existingLesson = await this.lessonRepository.findById(id)
        if (!existingLesson) {
            throw new NotFoundException('Bài học không tồn tại')
        }

        const updateData = {
            title: dto.title,
            description: dto.description,
            teacherId: dto.teacherId,
        }

        const lesson = await this.lessonRepository.update(id, updateData)
        const lessonResponse = LessonResponseDto.fromEntity(lesson)

        return {
            success: true,
            message: 'Cập nhật bài học thành công',
            data: lessonResponse,
        }
    }
}
