// src/application/use-cases/course/update-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { UpdateCourseDto } from '../../dtos/course/update-course.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { NotFoundException, ConflictException  } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UpdateCourseUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository
    ) { }

    async execute(courseId: number, dto: UpdateCourseDto): Promise<BaseResponseDto<CourseResponseDto>> {
        const existingCourse = await this.courseRepository.findById(courseId)

        if (!existingCourse) {
            throw new NotFoundException('Không tìm thấy khóa học')
        }

        if (!existingCourse.canUpdate()) {
            throw new ConflictException('Khóa học này không thể chỉnh sửa')
        }

        // Validate compareAt price
        const newPrice = dto.priceVND ?? existingCourse.priceVND
        const newCompareAt = dto.compareAtVND ?? existingCourse.compareAtVND

        if (newCompareAt && newCompareAt <= newPrice) {
            throw new ConflictException('Giá gốc phải lớn hơn giá bán')
        }

        const updateData = {
            ...dto,
        }

        const updatedCourse = await this.courseRepository.update(courseId, updateData)
        const courseResponse = CourseResponseDto.fromEntity(updatedCourse)

        return {
            success: true,
            message: 'Cập nhật khóa học thành công',
            data: courseResponse,
        }
    }
}
