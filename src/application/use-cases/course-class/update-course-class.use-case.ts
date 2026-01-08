import { Inject, Injectable } from '@nestjs/common';
import type { ICourseClassRepository } from 'src/domain/repositories/course-class.repository';
import { CourseClassResponseDto } from 'src/application/dtos/course-class/course-class.dto';
import { UpdateCourseClassDto } from '../../dtos/course-class/update-course-class.dto';
import { UpdateCourseClassData } from 'src/domain/interface/course-class/course-class.interface';
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';

@Injectable()
export class UpdateCourseClassUseCase {
    constructor(
        @Inject('ICourseClassRepository')
        private readonly courseClassRepository: ICourseClassRepository,
    ) { }

    async execute(
        classId: number,
        dto: UpdateCourseClassDto,
    ): Promise<BaseResponseDto<CourseClassResponseDto>> {
        // Check if course class exists
        const existingClass = await this.courseClassRepository.findById(classId);
        if (!existingClass) {
            throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`);
        }

        // Validate date logic
        const startDate = dto.startDate
            ? new Date(dto.startDate)
            : existingClass.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : existingClass.endDate;

        if (startDate && endDate && endDate <= startDate) {
            throw new ConflictException(
                'Ngày kết thúc phải sau ngày bắt đầu',
            );
        }

        const data: UpdateCourseClassData = {
            className: dto.className,
            startDate: dto.startDate
                ? new Date(dto.startDate)
                : dto.startDate === null
                    ? null
                    : undefined,
            endDate: dto.endDate
                ? new Date(dto.endDate)
                : dto.endDate === null
                    ? null
                    : undefined,
            room: dto.room,
            instructorId: dto.instructorId,
        };

        const courseClass = await this.courseClassRepository.update(classId, data);

        return BaseResponseDto.success(
            'Cập nhật lớp học thành công',
            new CourseClassResponseDto(courseClass),
        );
    }
}
