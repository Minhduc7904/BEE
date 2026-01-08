import { Inject, Injectable } from '@nestjs/common';
import type { ICourseClassRepository } from 'src/domain/repositories/course-class.repository';
import { CourseClassResponseDto } from '../../dtos/course-class/course-class.dto';
import { CreateCourseClassDto } from '../../dtos/course-class/create-course-class.dto';
import { CreateCourseClassData } from 'src/domain/interface/course-class/course-class.interface';
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ConflictException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class CreateCourseClassUseCase {
    constructor(
        @Inject('ICourseClassRepository')
        private readonly courseClassRepository: ICourseClassRepository,
    ) { }

    async execute(dto: CreateCourseClassDto): Promise<BaseResponseDto<CourseClassResponseDto>> {
        // Validate date logic
        if (dto.startDate && dto.endDate) {
            const startDate = new Date(dto.startDate);
            const endDate = new Date(dto.endDate);

            if (endDate <= startDate) {
                throw new ConflictException(
                    'Ngày kết thúc phải sau ngày bắt đầu',
                );
            }
        }

        const data: CreateCourseClassData = {
            courseId: dto.courseId,
            className: dto.className,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            room: dto.room,
            instructorId: dto.instructorId,
        };

        const courseClass = await this.courseClassRepository.create(data);

        return BaseResponseDto.success(
            'Tạo lớp học thành công',
            new CourseClassResponseDto(courseClass),
        );
    }
}
