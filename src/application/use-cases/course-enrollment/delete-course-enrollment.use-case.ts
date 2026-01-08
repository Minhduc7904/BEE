import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ICourseEnrollmentRepository } from 'src/domain/repositories/course-enrollment.repository';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';

@Injectable()
export class DeleteCourseEnrollmentUseCase {
  constructor(
    @Inject('ICourseEnrollmentRepository')
    private readonly courseEnrollmentRepository: ICourseEnrollmentRepository,
  ) {}

  async execute(enrollmentId: number): Promise<BaseResponseDto<null>> {
    const enrollment = await this.courseEnrollmentRepository.findById(
      enrollmentId,
    );

    if (!enrollment) {
      throw new NotFoundException(
        `Không tìm thấy đăng ký khóa học với ID ${enrollmentId}`,
      );
    }

    await this.courseEnrollmentRepository.delete(enrollmentId);

    return new BaseResponseDto(
      true,
      'Xóa đăng ký khóa học thành công',
      null,
    );
  }
}
