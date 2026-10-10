import {
  CourseClassMakeupGroupCandidateResponseDto,
  CourseClassMakeupGroupResponseDto,
} from '../../dtos/course-class/course-class-makeup-group-response.dto'
import type {
  CourseClassMakeupCandidate,
  MakeupGroup,
} from '../../../domain/interface/course-class/course-class-makeup-group.interface'

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'
const MAX_OTHER_GROUP_NAMES = 3
const MIN_EFFECTIVE_GROUP_SIZE = 2

export const MAKEUP_DISABLED_REASON_EXPIRED = 'Lớp đã kết thúc, không thể thêm vào nhóm học bù'
export const MAKEUP_DISABLED_REASON_OTHER_GROUP_PREFIX = 'Đã thuộc nhóm học bù khác'

/**
 * Chuyển cột @db.Date (UTC midnight) sang chuỗi ngày YYYY-MM-DD, không lệch múi giờ.
 */
export function formatDateOnly(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null
}

/**
 * Ngày hiện tại theo Asia/Ho_Chi_Minh ở dạng YYYY-MM-DD.
 */
export function getVietnamDateKey(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * Lớp đã kết thúc khi endDate nằm trước ngày hiện tại tại Asia/Ho_Chi_Minh; không có endDate thì chưa kết thúc.
 */
export function isClassEnded(endDate: Date | null | undefined, now: Date): boolean {
  const endKey = formatDateOnly(endDate)
  return endKey !== null && endKey < getVietnamDateKey(now)
}

/**
 * Chỉ nhóm có ít nhất 2 lớp mới có hiệu lực; nhóm còn 1 lớp (do lớp bị xóa) được bỏ qua.
 */
export function getEffectiveGroups(groups: MakeupGroup[]): MakeupGroup[] {
  return groups.filter((group) => group.memberClassIds.length >= MIN_EFFECTIVE_GROUP_SIZE)
}

export function findGroupOfClass(groups: MakeupGroup[], classId: number): MakeupGroup | null {
  return groups.find((group) => group.memberClassIds.includes(classId)) ?? null
}

function describeOtherGroup(group: MakeupGroup, classNameById: Map<number, string>): string {
  const names = group.memberClassIds.map((classId) => classNameById.get(classId) ?? `Lớp #${classId}`)
  const shown = names.slice(0, MAX_OTHER_GROUP_NAMES).join(', ')
  const suffix = names.length > MAX_OTHER_GROUP_NAMES ? ', ...' : ''
  return `${MAKEUP_DISABLED_REASON_OTHER_GROUP_PREFIX}: ${shown}${suffix}`
}

/**
 * Dựng response nhóm học bù của một lớp nguồn từ danh sách lớp trong khóa học và các nhóm hiện có.
 *
 * - `selected`: lớp đang cùng nhóm với lớp nguồn. Lớp đã chọn luôn được phép bỏ chọn, kể cả khi đã kết thúc.
 * - Lớp chưa chọn bị disable khi đã kết thúc hoặc đang thuộc một nhóm học bù khác.
 */
export function buildCourseClassMakeupGroupResponse(params: {
  sourceClassId: number
  courseId: number
  classes: CourseClassMakeupCandidate[]
  groups: MakeupGroup[]
  now: Date
}): CourseClassMakeupGroupResponseDto {
  const { sourceClassId, courseId, classes, now } = params
  const groups = getEffectiveGroups(params.groups)
  const sourceGroup = findGroupOfClass(groups, sourceClassId)
  const selectedIds = new Set(sourceGroup ? sourceGroup.memberClassIds : [])
  const classNameById = new Map(classes.map((courseClass) => [courseClass.classId, courseClass.className]))

  const candidates = classes
    .filter((courseClass) => courseClass.classId !== sourceClassId)
    .map((courseClass) => {
      const selected = selectedIds.has(courseClass.classId)
      const isExpired = isClassEnded(courseClass.endDate, now)
      let disabledReason: string | null = null

      if (!selected) {
        const otherGroup = findGroupOfClass(groups, courseClass.classId)

        if (isExpired) {
          disabledReason = MAKEUP_DISABLED_REASON_EXPIRED
        } else if (otherGroup) {
          disabledReason = describeOtherGroup(otherGroup, classNameById)
        }
      }

      return new CourseClassMakeupGroupCandidateResponseDto({
        classId: courseClass.classId,
        className: courseClass.className,
        weeklySchedule: courseClass.weeklySchedule,
        startDate: formatDateOnly(courseClass.startDate),
        endDate: formatDateOnly(courseClass.endDate),
        room: courseClass.room,
        instructorName: courseClass.instructorName,
        selected,
        isExpired,
        disabled: disabledReason !== null,
        disabledReason,
      })
    })

  return new CourseClassMakeupGroupResponseDto({
    sourceClassId,
    courseId,
    groupId: sourceGroup?.groupId ?? null,
    candidates,
  })
}
