import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IClassStudentRepository } from 'src/domain/repositories/class-student.repository';
import { BaseResponseDto } from '../../dtos/common/base-response.dto';

@Injectable()
export class DeleteClassStudentUseCase {
  constructor(
    @Inject('IClassStudentRepository')
    private readonly classStudentRepository: IClassStudentRepository,
  ) {}

  async execute(
    classId: number,
    studentId: number,
  ): Promise<BaseResponseDto<null>> {
    // Check if class student exists
    const exists = await this.classStudentRepository.exists(
      classId,
      studentId,
    );
    if (!exists) {
      throw new NotFoundException(
        `Không tìm thấy học sinh trong lớp học này`,
      );
    }

    await this.classStudentRepository.delete(classId, studentId);

    return new BaseResponseDto(
      true,
      'Xóa học sinh khỏi lớp học thành công',
      null,
    );
  }
}
