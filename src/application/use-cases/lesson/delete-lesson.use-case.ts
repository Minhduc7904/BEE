// src/application/use-cases/lesson/delete-lesson.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ILessonRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteLessonUseCase {
    constructor(
        @Inject('ILessonRepository')
        private readonly lessonRepository: ILessonRepository
    ) { }

    async execute(id: number): Promise<BaseResponseDto<null>> {
        // Check if lesson exists
        const existingLesson = await this.lessonRepository.findById(id)
        if (!existingLesson) {
            throw new NotFoundException('Bài học không tồn tại')
        }

        await this.lessonRepository.delete(id)

        return {
            success: true,
            message: 'Xóa bài học thành công',
            data: null,
        }
    }
}
