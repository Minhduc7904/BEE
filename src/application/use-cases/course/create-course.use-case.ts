// src/application/use-cases/course/create-course.use-case.ts
import { Inject, Injectable } from '@nestjs/common'
import type { ICourseRepository } from '../../../domain/repositories'
import { CreateCourseDto } from '../../dtos/course/create-course.dto'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { CourseResponseDto } from '../../dtos/course/course.dto'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CreateCourseUseCase {
    constructor(
        @Inject('ICourseRepository')
        private readonly courseRepository: ICourseRepository
    ) { }
    async execute(dto: CreateCourseDto): Promise<BaseResponseDto<CourseResponseDto>> {
        // Validate compareAt price
        if (dto.compareAtVND && dto.compareAtVND <= dto.priceVND) {
            throw new ConflictException('Giá gốc phải lớn hơn giá bán')
        }

        const createData = {
            title: dto.title,
            subtitle: dto.subtitle,
            academicYear: dto.academicYear,
            grade: dto.grade,
            subjectId: dto.subjectId,
            description: dto.description,
            priceVND: dto.priceVND,
            compareAtVND: dto.compareAtVND,
            visibility: dto.visibility || 'DRAFT',
            teacherId: dto.teacherId,
            isUpdatable: dto.isUpdatable ?? true,
        }

        const course = await this.courseRepository.create(createData)
        const courseResponse = CourseResponseDto.fromEntity(course)

        return {
            success: true,
            message: 'Tạo khóa học thành công',
            data: courseResponse,
        }
    }
}
