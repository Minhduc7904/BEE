import { Inject, Injectable } from '@nestjs/common';
import type { ICourseClassRepository, IClassStudentRepository } from 'src/domain/repositories';
import { CourseClassResponseDto } from 'src/application/dtos/course-class/course-class.dto';
import { NotFoundException, ConflictException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';

@Injectable()
export class GetCourseClassByIdUseCase {
  constructor(
    @Inject('ICourseClassRepository')
    private readonly courseClassRepository: ICourseClassRepository,
    @Inject('IClassStudentRepository')
    private readonly classStudentRepository: IClassStudentRepository,
  ) { }

  async execute(classId: number, studentId?: number): Promise<BaseResponseDto<CourseClassResponseDto>> {
    const courseClass = await this.courseClassRepository.findById(classId);

    if (studentId) {
      const isEnrolled = await this.classStudentRepository.exists(classId, studentId);
      if (!isEnrolled) {
        throw new ConflictException(`Bạn không có quyền truy cập lớp học này`);
      }
    }

    if (!courseClass) {
      throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`);
    }

    return BaseResponseDto.success(
      'Lấy lớp học thành công',
      new CourseClassResponseDto(courseClass),
    );
  }
}
