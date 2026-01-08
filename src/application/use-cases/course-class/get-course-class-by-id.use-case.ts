import { Inject, Injectable } from '@nestjs/common';
import type { ICourseClassRepository } from 'src/domain/repositories/course-class.repository';
import { CourseClassResponseDto } from 'src/application/dtos/course-class/course-class.dto';
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto';

@Injectable()
export class GetCourseClassByIdUseCase {
  constructor(
    @Inject('ICourseClassRepository')
    private readonly courseClassRepository: ICourseClassRepository,
  ) {}

  async execute(classId: number): Promise<BaseResponseDto<CourseClassResponseDto>> {
    const courseClass = await this.courseClassRepository.findById(classId);

    if (!courseClass) {
      throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`);
    }

    return BaseResponseDto.success(
      'Lấy lớp học thành công',
      new CourseClassResponseDto(courseClass),
    );
  }
}
