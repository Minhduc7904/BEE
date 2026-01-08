// src/application/use-cases/course/delete-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class DeleteCourseUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository
    ) { }

    async execute(courseId: number): Promise<BaseResponseDto<null>> {
        const course = await this.courseRepository.findById(courseId)

        if (!course) {
            throw new NotFoundException('Không tìm thấy khóa học')
        }

        await this.courseRepository.delete(courseId)

        return {
            success: true,
            message: 'Xóa khóa học thành công',
            data: null,
        }
    }
}
