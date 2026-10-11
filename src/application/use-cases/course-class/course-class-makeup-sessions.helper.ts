import {
  CourseClassMakeupSessionDto,
  CourseClassMakeupSessionItemDto,
  CourseClassMakeupSessionsResponseDto,
} from '../../dtos/course-class/course-class-makeup-sessions-response.dto'
import type { MakeupGroup } from '../../../domain/interface/course-class/course-class-makeup-group.interface'
import type { ParentScheduleWeekRange } from '../parent-student-schedule/parent-student-schedule-week'
import { formatScheduleDate } from '../parent-student-schedule/parent-student-schedule-week'

export interface MakeupSessionSource {
  sessionId: number
  classId: number
  name: string
  sessionDate: Date
  startTime: Date
  endTime: Date
}

function timeOfDay(time: Date): string {
  return time.toISOString().slice(11, 19)
}

function compareSessions(left: MakeupSessionSource, right: MakeupSessionSource): number {
  return (
    left.sessionDate.getTime() - right.sessionDate.getTime() ||
    timeOfDay(left.startTime).localeCompare(timeOfDay(right.startTime)) ||
    left.sessionId - right.sessionId
  )
}

/**
 * Suy ra các buổi có thể học bù cho nhau trong một tuần.
 *
 * - Chỉ nhóm học bù hiệu lực (từ 2 lớp) mới có quan hệ; `group = null` trả danh sách rỗng.
 * - Buổi A (lớp nguồn) có thể học bù cho buổi B khi B thuộc lớp khác cùng nhóm và B nằm cùng tuần với A.
 * - Buổi nằm ngoài tuần `week` bị loại, nên buổi khác tuần không bao giờ ghép được với nhau.
 */
export function buildCourseClassMakeupSessionsResponse(params: {
  sourceClassId: number
  courseId: number
  group: MakeupGroup | null
  week: ParentScheduleWeekRange
  sessions: MakeupSessionSource[]
  classNameById: Map<number, string>
}): CourseClassMakeupSessionsResponseDto {
  const { sourceClassId, courseId, group, week, sessions, classNameById } = params

  const toItem = (session: MakeupSessionSource): CourseClassMakeupSessionItemDto =>
    new CourseClassMakeupSessionItemDto({
      sessionId: session.sessionId,
      classId: session.classId,
      className: classNameById.get(session.classId) ?? `Lớp #${session.classId}`,
      name: session.name,
      sessionDate: formatScheduleDate(session.sessionDate),
      startTime: session.startTime,
      endTime: session.endTime,
    })

  const base = { sourceClassId, courseId, weekStart: week.weekStart, weekEnd: week.weekEnd }

  if (!group) {
    return new CourseClassMakeupSessionsResponseDto({ ...base, groupId: null, sessions: [] })
  }

  const memberClassIds = new Set(group.memberClassIds)
  const inWeek = sessions
    .filter(
      (session) =>
        memberClassIds.has(session.classId) &&
        session.sessionDate.getTime() >= week.from.getTime() &&
        session.sessionDate.getTime() <= week.to.getTime(),
    )
    .sort(compareSessions)

  const peerItems = inWeek.filter((session) => session.classId !== sourceClassId).map(toItem)

  return new CourseClassMakeupSessionsResponseDto({
    ...base,
    groupId: group.groupId,
    sessions: inWeek
      .filter((session) => session.classId === sourceClassId)
      .map((session) => new CourseClassMakeupSessionDto({ ...toItem(session), makeupCandidates: peerItems })),
  })
}
