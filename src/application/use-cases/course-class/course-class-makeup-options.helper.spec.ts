import type {
  CourseClassMakeupCandidate,
  CourseClassMakeupEdge,
} from '../../../domain/interface/course-class/course-class-makeup-option.interface'
import {
  buildCourseClassMakeupOptionsResponse,
  findClassIdsReaching,
  hasCycle,
  isClassEnded,
  MAKEUP_DISABLED_REASON_CYCLE,
  MAKEUP_DISABLED_REASON_EXPIRED,
} from './course-class-makeup-options.helper'

function edge(sourceClassId: number, makeupClassId: number): CourseClassMakeupEdge {
  return { sourceClassId, makeupClassId }
}

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

const NOW = new Date('2026-10-04T03:00:00.000Z')

describe('hasCycle', () => {
  it('không báo chu trình với graph rỗng hoặc DAG', () => {
    expect(hasCycle([])).toBe(false)
    expect(hasCycle([edge(1, 2), edge(1, 3), edge(2, 3), edge(3, 4)])).toBe(false)
  })

  it('phát hiện chu trình tự trỏ', () => {
    expect(hasCycle([edge(1, 1)])).toBe(true)
  })

  it('phát hiện chu trình trực tiếp A→B→A', () => {
    expect(hasCycle([edge(1, 2), edge(2, 1)])).toBe(true)
  })

  it('phát hiện chu trình gián tiếp A→B→C→A', () => {
    expect(hasCycle([edge(1, 2), edge(2, 3), edge(3, 1)])).toBe(true)
  })

  it('phát hiện chu trình ở thành phần không liên thông với node đầu tiên', () => {
    expect(hasCycle([edge(1, 2), edge(10, 11), edge(11, 12), edge(12, 10)])).toBe(true)
  })

  it('không coi đường kim cương là chu trình', () => {
    expect(hasCycle([edge(1, 2), edge(1, 3), edge(2, 4), edge(3, 4)])).toBe(false)
  })

  it('không tràn stack với chuỗi rất dài', () => {
    const edges = Array.from({ length: 20000 }, (_, index) => edge(index + 1, index + 2))
    expect(hasCycle(edges)).toBe(false)
    expect(hasCycle([...edges, edge(20001, 1)])).toBe(true)
  })
})

describe('findClassIdsReaching', () => {
  it('trả mọi lớp đi được tới đích theo chiều cạnh, gồm cả đường gián tiếp', () => {
    const edges = [edge(1, 2), edge(2, 3), edge(4, 3), edge(5, 6)]
    expect(findClassIdsReaching(edges, 3)).toEqual(new Set([1, 2, 4]))
  })

  it('không gồm lớp chỉ đi ra từ đích hoặc lớp không liên quan', () => {
    const edges = [edge(3, 7), edge(8, 9)]
    expect(findClassIdsReaching(edges, 3)).toEqual(new Set())
  })

  it('kết thúc khi graph đã có chu trình', () => {
    expect(findClassIdsReaching([edge(1, 2), edge(2, 1)], 1)).toEqual(new Set([1, 2]))
  })
})

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

describe('buildCourseClassMakeupOptionsResponse', () => {
  it('loại lớp nguồn, giữ thứ tự đầu vào và format ngày dạng date-only', () => {
    const response = buildCourseClassMakeupOptionsResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2), candidate(3)],
      edges: [edge(1, 3)],
      now: NOW,
    })

    expect(response.sourceClassId).toBe(1)
    expect(response.courseId).toBe(20)
    expect(response.candidates.map((item) => item.classId)).toEqual([2, 3])
    expect(response.candidates[0]).toMatchObject({
      startDate: '2026-09-01',
      endDate: '2027-05-31',
      selected: false,
      disabled: false,
      disabledReason: null,
    })
    expect(response.candidates[1].selected).toBe(true)
  })

  it('disable lớp đã kết thúc chưa được chọn', () => {
    const response = buildCourseClassMakeupOptionsResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2, { endDate: new Date('2026-10-03T00:00:00.000Z') })],
      edges: [],
      now: NOW,
    })

    expect(response.candidates[0]).toMatchObject({
      isExpired: true,
      selected: false,
      disabled: true,
      disabledReason: MAKEUP_DISABLED_REASON_EXPIRED,
    })
  })

  it('giữ lớp đã kết thúc đang được chọn ở trạng thái bỏ chọn được và gắn nhãn hết hạn', () => {
    const response = buildCourseClassMakeupOptionsResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2, { endDate: new Date('2026-10-03T00:00:00.000Z') })],
      edges: [edge(1, 2)],
      now: NOW,
    })

    expect(response.candidates[0]).toMatchObject({
      isExpired: true,
      selected: true,
      disabled: false,
      disabledReason: null,
    })
  })

  it('disable lớp chưa chọn nếu thêm vào sẽ tạo chu trình trực tiếp hoặc gián tiếp', () => {
    const response = buildCourseClassMakeupOptionsResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2), candidate(3), candidate(4)],
      // 2→1 (trực tiếp), 3→4→1 (gián tiếp); lớp 5 không liên quan
      edges: [edge(2, 1), edge(3, 4), edge(4, 1)],
      now: NOW,
    })

    const byId = new Map(response.candidates.map((item) => [item.classId, item]))
    expect(byId.get(2)).toMatchObject({ disabled: true, disabledReason: MAKEUP_DISABLED_REASON_CYCLE })
    expect(byId.get(3)).toMatchObject({ disabled: true, disabledReason: MAKEUP_DISABLED_REASON_CYCLE })
    expect(byId.get(4)).toMatchObject({ disabled: true, disabledReason: MAKEUP_DISABLED_REASON_CYCLE })
  })

  it('ưu tiên lý do đã kết thúc khi lớp vừa hết hạn vừa tạo chu trình', () => {
    const response = buildCourseClassMakeupOptionsResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [candidate(1), candidate(2, { endDate: new Date('2026-10-03T00:00:00.000Z') })],
      edges: [edge(2, 1)],
      now: NOW,
    })

    expect(response.candidates[0].disabledReason).toBe(MAKEUP_DISABLED_REASON_EXPIRED)
  })

  it('trả null cho các trường tùy chọn thiếu dữ liệu', () => {
    const response = buildCourseClassMakeupOptionsResponse({
      sourceClassId: 1,
      courseId: 20,
      classes: [
        candidate(1),
        candidate(2, { weeklySchedule: null, startDate: null, endDate: null, room: null, instructorName: null }),
      ],
      edges: [],
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
