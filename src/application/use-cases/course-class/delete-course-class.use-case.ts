import { Inject, Injectable } from '@nestjs/common';
import type { ICourseClassRepository } from 'src/domain/repositories/course-class.repository';
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions';
import { BaseResponseDto } from '../../dtos/common/base-response.dto'

@Injectable()
export class DeleteCourseClassUseCase {
    constructor(
        @Inject('ICourseClassRepository')
        private readonly courseClassRepository: ICourseClassRepository,
    ) { }

    async execute(classId: number): Promise<BaseResponseDto<null>> {
        // Check if course class exists
        const courseClass = await this.courseClassRepository.findById(classId);
        if (!courseClass) {
            throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`);
        }

        await this.courseClassRepository.delete(classId);

        return BaseResponseDto.success('Xóa lớp học thành công', null);
    }
}
