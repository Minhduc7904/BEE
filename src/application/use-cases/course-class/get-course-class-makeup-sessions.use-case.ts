import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CourseClassMakeupSessionsResponseDto } from 'src/application/dtos/course-class/course-class-makeup-sessions-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { resolveScheduleWeek } from '../parent-student-schedule/parent-student-schedule-week'
import { findGroupOfClass, getEffectiveGroups } from './course-class-makeup-group.helper'
import { buildCourseClassMakeupSessionsResponse } from './course-class-makeup-sessions.helper'

@Injectable()
export class GetCourseClassMakeupSessionsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(classId: number, weekStart: string): Promise<BaseResponseDto<CourseClassMakeupSessionsResponseDto>> {
    const week = resolveScheduleWeek(weekStart)

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const source = await repos.courseClassRepository.findById(classId)

      if (!source) {
        throw new NotFoundException(`Lớp học với ID ${classId} không tồn tại`)
      }

      const groupRepository = repos.courseClassMakeupGroupRepository
      const groups = getEffectiveGroups(await groupRepository.findGroupsByCourse(source.courseId))
      const group = findGroupOfClass(groups, source.classId)
      const sessions = group
        ? await repos.classSessionRepository.findByClassIdsAndSessionDateRange(group.memberClassIds, week.from, week.to)
        : []
      const classes = group ? await groupRepository.findClassesByCourse(source.courseId) : []

      return buildCourseClassMakeupSessionsResponse({
        sourceClassId: source.classId,
        courseId: source.courseId,
        group,
        week,
        sessions,
        classNameById: new Map(classes.map((courseClass) => [courseClass.classId, courseClass.className])),
      })
    })

    return BaseResponseDto.success('Lấy các buổi học bù trong tuần thành công', result)
  }
}
