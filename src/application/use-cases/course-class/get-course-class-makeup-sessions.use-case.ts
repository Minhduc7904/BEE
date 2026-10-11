import { Inject, Injectable } from '@nestjs/common'
import type { IUnitOfWork } from 'src/domain/repositories'
import { BaseResponseDto } from 'src/application/dtos/common/base-response.dto'
import { CourseClassMakeupSessionsResponseDto } from 'src/application/dtos/course-class/course-class-makeup-sessions-response.dto'
import { NotFoundException } from 'src/shared/exceptions/custom-exceptions'
import { resolveScheduleWeek } from '../parent-student-schedule/parent-student-schedule-week'
import { findGroupOfClass, getEffectiveGroups } from './course-class-makeup-group.helper'
import { buildCourseClassMakeupSessionsResponse, type MakeupSessionSource } from './course-class-makeup-sessions.helper'

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
      const sourceSessions = group
        ? await repos.classSessionRepository.findByClassIdsAndSessionDateRange([source.classId], week.from, week.to)
        : []
      // Cặp buổi học bù đọc từ bảng session_makeup_registrations (được đồng bộ khi buổi học/nhóm thay đổi).
      const registrations = await repos.sessionMakeupRegistrationRepository.findBySessionIds(
        sourceSessions.map((session) => session.sessionId),
      )
      const makeupSessionsBySessionId = new Map<number, MakeupSessionSource[]>()
      for (const registration of registrations) {
        if (!registration.makeupSession) continue

        const makeupSessions = makeupSessionsBySessionId.get(registration.sessionId) ?? []
        makeupSessions.push(registration.makeupSession)
        makeupSessionsBySessionId.set(registration.sessionId, makeupSessions)
      }
      const classes = group ? await groupRepository.findClassesByCourse(source.courseId) : []

      return buildCourseClassMakeupSessionsResponse({
        sourceClassId: source.classId,
        courseId: source.courseId,
        groupId: group?.groupId ?? null,
        week,
        sourceSessions,
        makeupSessionsBySessionId,
        classNameById: new Map(classes.map((courseClass) => [courseClass.classId, courseClass.className])),
      })
    })

    return BaseResponseDto.success('Lấy các buổi học bù trong tuần thành công', result)
  }
}
