// src/application/use-cases/lesson/get-lesson-by-id.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { LessonResponseDto } from '../../dtos/lesson/lesson.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetLessonByIdUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository
    ) { }

    async execute(id: number): Promise<BaseResponseDto<LessonResponseDto>> {
        const lesson = await this.lessonRepository.findById(id)

        if (!lesson) {
            throw new NotFoundException('Bài học không tồn tại')
        }

        const lessonResponse = LessonResponseDto.fromEntity(lesson)

        return {
            success: true,
            message: 'Lấy thông tin bài học thành công',
            data: lessonResponse,
        }
    }
}
