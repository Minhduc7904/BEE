import { Injectable } from '@nestjs/common'
import type { UnitOfWorkRepos } from 'src/domain/repositories'
import { getEffectiveGroups } from '../use-cases/course-class/course-class-makeup-group.helper'
import {
  buildMakeupPairs,
  getWeekEnd,
  getWeekStart,
} from '../use-cases/course-class/session-makeup-registration.helper'

export interface SyncSessionMakeupRegistrationParams {
  /** Các lớp có buổi học hoặc nhóm học bù vừa thay đổi. */
  classIds: number[]
  /** Giới hạn theo ngày (UTC midnight); được mở rộng thành trọn các tuần Thứ Hai đến Chủ Nhật. Bỏ trống: mọi buổi. */
  range?: { from: Date; to: Date }
}

/**
 * Đồng bộ bảng `session_makeup_registrations` với buổi học và nhóm học bù hiện tại.
 * Hàm nhận `repos` để chạy trong transaction của use case gọi nó.
 */
@Injectable()
export class SessionMakeupRegistrationSyncService {
  async syncForClasses(repos: UnitOfWorkRepos, params: SyncSessionMakeupRegistrationParams): Promise<void> {
    const classIds = [...new Set(params.classIds)]

    if (classIds.length === 0) return

    const courseClasses = await repos.courseClassRepository.findByIds(classIds)
    const courseIds = [...new Set(courseClasses.map((courseClass) => courseClass.courseId))]

    const classToGroupId = new Map<number, number>()
    const affectedClassIds = new Set<number>(classIds)

    for (const courseId of courseIds) {
      const groups = getEffectiveGroups(await repos.courseClassMakeupGroupRepository.findGroupsByCourse(courseId))

      for (const group of groups) {
        for (const memberClassId of group.memberClassIds) {
          classToGroupId.set(memberClassId, group.groupId)
        }

        // Nhóm có lớp bị ảnh hưởng thì mọi lớp trong nhóm cũng phải được tính lại.
        if (group.memberClassIds.some((memberClassId) => affectedClassIds.has(memberClassId))) {
          group.memberClassIds.forEach((memberClassId) => affectedClassIds.add(memberClassId))
        }
      }
    }

    const range = params.range ? { from: getWeekStart(params.range.from), to: getWeekEnd(params.range.to) } : undefined
    const sessions = await repos.classSessionRepository.findByClassIds([...affectedClassIds], range)

    await repos.sessionMakeupRegistrationRepository.deleteTouchingSessionIds(
      sessions.map((session) => session.sessionId),
    )
    await repos.sessionMakeupRegistrationRepository.createMany(buildMakeupPairs(sessions, classToGroupId))
  }
}
