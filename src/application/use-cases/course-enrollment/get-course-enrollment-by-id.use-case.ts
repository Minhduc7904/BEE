import { Inject, Injectable } from '@nestjs/common';
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository';
import { CourseEnrollmentResponseDto } from '../../dtos/course-enrollment/course-enrollment.dto';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions';
@Injectable()
export class GetCourseEnrollmentByIdUseCase {
  constructor(
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
  ) { }

  async execute(
    enrollmentId: number,
    studentId?: number,
  ): Promise<BaseResponseDto<CourseEnrollmentResponseDto>> {
    const enrollment = await this.courseEnrollmentRepository.findById(
      enrollmentId,
    );

    if (studentId && enrollment?.studentId !== studentId) {
      throw new ConflictException(`Bạn không có quyền truy cập đăng ký khóa học này`);
    }

    if (!enrollment) {
      throw new NotFoundException(
        `Không tìm thấy đăng ký khóa học với ID ${enrollmentId}`,
      );
    }

    const enrollmentDto = new CourseEnrollmentResponseDto(enrollment);

    return new BaseResponseDto(
      true,
      'Lấy thông tin đăng ký khóa học thành công',
      enrollmentDto,
    );
  }
}
