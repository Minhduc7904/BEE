import {
  CourseClassMakeupSessionDto,
  CourseClassMakeupSessionItemDto,
  CourseClassMakeupSessionsResponseDto,
} from '../../dtos/course-class/course-class-makeup-sessions-response.dto'
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
 * Dựng response các buổi học bù trong một tuần từ bảng `session_makeup_registrations` (không suy luận lúc đọc).
 *
 * - Chỉ nhóm học bù hiệu lực (từ 2 lớp) mới có quan hệ; `groupId = null` trả danh sách rỗng.
 * - `sourceSessions`: các buổi của lớp nguồn trong tuần.
 * - `makeupSessionsBySessionId`: với mỗi buổi nguồn, các buổi học bù được cho nó (đọc từ bảng).
 */
export function buildCourseClassMakeupSessionsResponse(params: {
  sourceClassId: number
  courseId: number
  groupId: number | null
  week: ParentScheduleWeekRange
  sourceSessions: MakeupSessionSource[]
  makeupSessionsBySessionId: Map<number, MakeupSessionSource[]>
  classNameById: Map<number, string>
}): CourseClassMakeupSessionsResponseDto {
  const { sourceClassId, courseId, groupId, week, sourceSessions, makeupSessionsBySessionId, classNameById } = params

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

  if (groupId === null) {
    return new CourseClassMakeupSessionsResponseDto({ ...base, groupId: null, sessions: [] })
  }

  return new CourseClassMakeupSessionsResponseDto({
    ...base,
    groupId,
    sessions: [...sourceSessions].sort(compareSessions).map(
      (session) =>
        new CourseClassMakeupSessionDto({
          ...toItem(session),
          makeupCandidates: [...(makeupSessionsBySessionId.get(session.sessionId) ?? [])]
            .sort(compareSessions)
            .map(toItem),
        }),
    ),
  })
}
