import type {
  CourseClassMakeupCandidate,
  MakeupGroup,
} from '../../../domain/interface/course-class/course-class-makeup-group.interface'
import {
  buildCourseClassMakeupGroupResponse,
  findGroupOfClass,
  getEffectiveGroups,
  isClassEnded,
  MAKEUP_DISABLED_REASON_EXPIRED,
  MAKEUP_DISABLED_REASON_OTHER_GROUP_PREFIX,
} from './course-class-makeup-group.helper'

function candidate(classId: number, overrides: Partial<CourseClassMakeupCandidate> = {}): CourseClassMakeupCandidate {
  return {
    classId,
    className: `Lớp ${classId}`,
    weeklySchedule: 'Thứ 4 - 18:00',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2027-05-31T00:00:00.000Z'),
    room: 'P402',
    instructorName: 'Nguyễn Ngọc',
    ...overrides,
  }
}

function group(groupId: number, memberClassIds: number[]): MakeupGroup {
  return { groupId, memberClassIds }
}

const NOW = new Date('2026-10-04T03:00:00.000Z')

describe('isClassEnded', () => {
  it('không có endDate thì chưa kết thúc', () => {
    expect(isClassEnded(null, NOW)).toBe(false)
  })

  it('endDate trước ngày hôm nay theo giờ Việt Nam thì đã kết thúc', () => {
    expect(isClassEnded(new Date('2026-10-03T00:00:00.000Z'), NOW)).toBe(true)
  })

  it('endDate đúng hôm nay thì chưa kết thúc', () => {
    expect(isClassEnded(new Date('2026-10-04T00:00:00.000Z'), NOW)).toBe(false)
  })

  it('dùng ngày Việt Nam khi UTC vẫn còn là hôm qua', () => {
    const justAfterVietnamMidnight = new Date('2026-10-03T17:30:00.000Z')
    expect(isClassEnded(new Date('2026-10-03T00:00:00.000Z'), justAfterVietnamMidnight)).toBe(true)
  })
})

describe('nhóm có hiệu lực', () => {
  it('chỉ giữ nhóm có ít nhất 2 lớp', () => {
    expect(getEffectiveGroups([group(1, [1]), group(2, [2, 3]), group(3, [])])).toEqual([group(2, [2, 3])])
  })

  it('tìm nhóm chứa một lớp hoặc trả null', () => {
    const groups = [group(1, [1, 2]), group(2, [3, 4])]
    expect(findGroupOfClass(groups, 4)).toEqual(group(2, [3, 4]))
    expect(findGroupOfClass(groups, 9)).toBeNull()
  })
})

describe('buildCourseClassMakeupGroupResponse', () => {
  const classes = [candidate(1), candidate(2), candidate(3), candidate(4), candidate(5)]

  it('đánh dấu các lớp cùng nhóm, loại lớp nguồn và format ngày date-only', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes,
      groups: [group(7, [1, 3, 4])],
      now: NOW,
    })

    expect(response.sourceClassId).toBe(1)
    expect(response.courseId).toBe(20)
    expect(response.groupId).toBe(7)
    expect(response.candidates.map((item) => item.classId)).toEqual([2, 3, 4, 5])
    expect(response.candidates.filter((item) => item.selected).map((item) => item.classId)).toEqual([3, 4])
    expect(response.candidates[0]).toMatchObject({
      startDate: '2026-09-01',
      endDate: '2027-05-31',
      selected: false,
      disabled: false,
      disabledReason: null,
    })
  })

  it('lớp nguồn chưa có nhóm thì groupId là null và không lớp nào được chọn', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes,
      groups: [],
      now: NOW,
    })

    expect(response.groupId).toBeNull()
    expect(response.candidates.some((item) => item.selected)).toBe(false)
  })

  it('disable lớp đang thuộc nhóm học bù khác và nêu tên các lớp trong nhóm đó', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes,
      groups: [group(8, [2, 3])],
      now: NOW,
    })

    const byId = new Map(response.candidates.map((item) => [item.classId, item]))
    expect(byId.get(2)).toMatchObject({
      selected: false,
      disabled: true,
      disabledReason: `${MAKEUP_DISABLED_REASON_OTHER_GROUP_PREFIX}: Lớp 2, Lớp 3`,
    })
    expect(byId.get(3)?.disabled).toBe(true)
    expect(byId.get(4)?.disabled).toBe(false)
  })

  it('rút gọn danh sách tên khi nhóm khác có nhiều hơn 3 lớp', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2), candidate(3), candidate(4), candidate(5), candidate(6)],
      groups: [group(8, [2, 3, 4, 5, 6])],
      now: NOW,
    })

    expect(response.candidates[0].disabledReason).toBe(
      `${MAKEUP_DISABLED_REASON_OTHER_GROUP_PREFIX}: Lớp 2, Lớp 3, Lớp 4, ...`,
    )
  })

  it('bỏ qua nhóm chỉ còn một lớp (mồ côi)', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes,
      groups: [group(9, [2])],
      now: NOW,
    })

    expect(response.candidates[0]).toMatchObject({ classId: 2, disabled: false, selected: false })
  })

  it('disable lớp đã kết thúc chưa được chọn', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2, { endDate: new Date('2026-10-03T00:00:00.000Z') })],
      groups: [],
      now: NOW,
    })

    expect(response.candidates[0]).toMatchObject({
      isExpired: true,
      selected: false,
      disabled: true,
      disabledReason: MAKEUP_DISABLED_REASON_EXPIRED,
    })
  })

  it('giữ lớp đã kết thúc đang cùng nhóm ở trạng thái bỏ chọn được và gắn nhãn hết hạn', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2, { endDate: new Date('2026-10-03T00:00:00.000Z') })],
      groups: [group(7, [1, 2])],
      now: NOW,
    })

    expect(response.candidates[0]).toMatchObject({
      isExpired: true,
      selected: true,
      disabled: false,
      disabledReason: null,
    })
  })

  it('ưu tiên lý do đã kết thúc khi lớp vừa hết hạn vừa thuộc nhóm khác', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2, { endDate: new Date('2026-10-03T00:00:00.000Z') }), candidate(3)],
      groups: [group(8, [2, 3])],
      now: NOW,
    })

    expect(response.candidates[0].disabledReason).toBe(MAKEUP_DISABLED_REASON_EXPIRED)
  })

  it('trả null cho các trường tùy chọn thiếu dữ liệu', () => {
    const response = buildCourseClassMakeupGroupResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [
        candidate(1),
        candidate(2, { weeklySchedule: null, startDate: null, endDate: null, room: null, instructorName: null }),
      ],
      groups: [],
      now: NOW,
    })

    expect(response.candidates[0]).toMatchObject({
      weeklySchedule: null,
      startDate: null,
      endDate: null,
      room: null,
      instructorName: null,
      isExpired: false,
    })
  })
})
