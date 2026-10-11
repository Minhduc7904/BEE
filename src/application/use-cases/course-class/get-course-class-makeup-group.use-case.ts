import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CourseClassMakeupGroupResponseDto } from 'src/application/dtos/course-class/course-class-makeup-group-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { buildCourseClassMakeupGroupResponse } from './course-class-makeup-group.helper'

@Injectable()
export class GetCourseClassMakeupGroupUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(classId: number): Promise<BaseResponseDto<CourseClassMakeupGroupResponseDto>> {
    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const source = await repos.courseClassRepository.findById(classId)

      if (!source) {
        throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`)
      }

      const classes = await repos.courseClassMakeupGroupRepository.findClassesByCourse(source.courseId)
      const groups = await repos.courseClassMakeupGroupRepository.findGroupsByCourse(source.courseId)

      return buildCourseClassMakeupGroupResponse({
        sourceClassId: source.classId,
        courseId: source.courseId,
        classes,
        groups,
        now: new Date(),
      })
    })

    return BaseResponseDto.success('Lấy nhóm lớp học bù thành công', result)
  }
}
