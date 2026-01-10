import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository';
import { UpdateCourseEnrollmentDto } from 'src/application/dtos/course-enrollment/update-course-enrollment.dto';
import { CourseEnrollmentResponseDto } from 'src/application/dtos/course-enrollment/course-enrollment.dto';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';
import { CourseEnrollmentStatus } from '@prisma/client';

@Injectable()
export class UpdateCourseEnrollmentUseCase {
    constructor(
        @Inject('ICourseEnrollmentRepository')
        private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
    ) { }

    async execute(
        enrollmentId: number,
        updateDto: UpdateCourseEnrollmentDto,
    ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
        const enrollment = await this.courseEnrollmentRepository.findById(
            enrollmentId,
        );

        if (!enrollment) {
            throw new NotFoundException(
                `Không tìm thấy đăng ký khóa học với ID ${enrollmentId}`,
            );
        }

        // Validate status transition
        if (updateDto.status) {
            const validStatuses = Object.values(CourseEnrollmentStatus);
            if (!validStatuses.includes(updateDto.status as CourseEnrollmentStatus)) {
                throw new BadRequestException(
                    `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`,
                );
            }

            // If trying to complete, check if can complete
            if (updateDto.status === CourseEnrollmentStatus.COMPLETED && !enrollment.canComplete()) {
                throw new BadRequestException(
                    'Không thể hoàn thành đăng ký đã bị hủy',
                );
            }

            // If trying to cancel, check if can cancel
            if (updateDto.status === CourseEnrollmentStatus.CANCELLED && !enrollment.canCancel()) {
                throw new BadRequestException(
                    'Không thể hủy đăng ký đã hoàn thành',
                );
            }
        }

        const updatedEnrollment = await this.courseEnrollmentRepository.update(
            enrollmentId,
            updateDto,
        );

        const enrollmentDto = new CourseEnrollmentResponseDto(updatedEnrollment);

        return new BaseResponseDto(
            true,
            'Cập nhật đăng ký khóa học thành công',
            enrollmentDto,
        );
    }
}
