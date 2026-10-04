import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CourseClassMakeupOptionsResponseDto } from 'src/application/dtos/course-class/course-class-makeup-options-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { buildCourseClassMakeupOptionsResponse } from './course-class-makeup-options.helper'

@Injectable()
export class GetCourseClassMakeupOptionsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(classId: number): Promise<BaseResponseDto<CourseClassMakeupOptionsResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const source = await repos.courseClassRepository.findById(classId)

      if (!source) {
        throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`)
      }

      const classes = await repos.courseClassMakeupOptionRepository.findClassesByCourse(source.courseId)
      const edges = await repos.courseClassMakeupOptionRepository.findEdgesByCourse(source.courseId)

      return buildCourseClassMakeupOptionsResponse({
        sourceClassId: source.classId,
        courseId: source.courseId,
        classes,
        edges,
        now: new Date(),
      })
    })

    return BaseResponseDto.success('Lấy cấu hình lớp học bù thành công', result)
  }
}
