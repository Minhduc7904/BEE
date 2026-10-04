import {
  CourseClassMakeupCandidateResponseDto,
  CourseClassMakeupOptionsResponseDto,
} from '../../dtos/course-class/course-class-makeup-options-response.dto'
import type {
  CourseClassMakeupCandidate,
  CourseClassMakeupEdge,
} from '../../../domain/interface/course-class/course-class-makeup-option.interface'

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export const MAKEUP_DISABLED_REASON_EXPIRED = 'Lớp đã kết thúc, không thể thêm làm lớp học bù'
export const MAKEUP_DISABLED_REASON_CYCLE = 'Thêm lớp này sẽ tạo vòng lặp học bù'

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

function buildAdjacency(edges: CourseClassMakeupEdge[]): Map<number, number[]> {
  const adjacency = new Map<number, number[]>()

  for (const edge of edges) {
    const targets = adjacency.get(edge.sourceClassId)

    if (targets) {
      targets.push(edge.makeupClassId)
    } else {
      adjacency.set(edge.sourceClassId, [edge.makeupClassId])
    }
  }

  return adjacency
}

/**
 * Phát hiện chu trình toàn graph bằng DFS tô màu (chưa thăm / đang thăm / đã xong), cài đặt lặp để không tràn stack.
 */
export function hasCycle(edges: CourseClassMakeupEdge[]): boolean {
  const adjacency = buildAdjacency(edges)
  const VISITING = 1
  const DONE = 2
  const color = new Map<number, number>()

  for (const start of adjacency.keys()) {
    if (color.has(start)) {
      continue
    }

    const stack: Array<{ node: number; nextIndex: number }> = [{ node: start, nextIndex: 0 }]
    color.set(start, VISITING)

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const neighbors = adjacency.get(frame.node) ?? []

      if (frame.nextIndex >= neighbors.length) {
        color.set(frame.node, DONE)
        stack.pop()
        continue
      }

      const next = neighbors[frame.nextIndex]
      frame.nextIndex += 1
      const nextColor = color.get(next)

      if (nextColor === VISITING) {
        return true
      }

      if (nextColor === undefined) {
        color.set(next, VISITING)
        stack.push({ node: next, nextIndex: 0 })
      }
    }
  }

  return false
}

/**
 * Tập mọi lớp có đường đi có hướng tới `targetClassId`, tính một lần bằng BFS trên graph đảo chiều.
 */
export function findClassIdsReaching(edges: CourseClassMakeupEdge[], targetClassId: number): Set<number> {
  const reverseAdjacency = new Map<number, number[]>()

  for (const edge of edges) {
    const sources = reverseAdjacency.get(edge.makeupClassId)

    if (sources) {
      sources.push(edge.sourceClassId)
    } else {
      reverseAdjacency.set(edge.makeupClassId, [edge.sourceClassId])
    }
  }

  const reaching = new Set<number>()
  const queue: number[] = [targetClassId]

  for (let index = 0; index < queue.length; index += 1) {
    for (const source of reverseAdjacency.get(queue[index]) ?? []) {
      if (!reaching.has(source)) {
        reaching.add(source)
        queue.push(source)
      }
    }
  }

  return reaching
}

/**
 * Dựng response cấu hình học bù từ danh sách lớp trong course và graph hiện tại.
 *
 * - Lớp đã chọn luôn được phép bỏ chọn, kể cả khi đã kết thúc (gắn `isExpired`).
 * - Lớp chưa chọn bị disable nếu đã kết thúc hoặc thêm vào sẽ tạo chu trình.
 *   Mọi chu trình mới đều đi qua lớp nguồn nên chỉ cần kiểm tra đích có đường quay về nguồn.
 */
export function buildCourseClassMakeupOptionsResponse(params: {
  sourceClassId: number
  courseId: number
  classes: CourseClassMakeupCandidate[]
  edges: CourseClassMakeupEdge[]
  now: Date
}): CourseClassMakeupOptionsResponseDto {
  const { sourceClassId, courseId, classes, edges, now } = params
  const selectedIds = new Set(
    edges.filter((edge) => edge.sourceClassId === sourceClassId).map((edge) => edge.makeupClassId),
  )
  const classIdsReachingSource = findClassIdsReaching(edges, sourceClassId)

  const candidates = classes
    .filter((courseClass) => courseClass.classId !== sourceClassId)
    .map((courseClass) => {
      const selected = selectedIds.has(courseClass.classId)
      const isExpired = isClassEnded(courseClass.endDate, now)
      let disabledReason: string | null = null

      if (!selected) {
        if (isExpired) {
          disabledReason = MAKEUP_DISABLED_REASON_EXPIRED
        } else if (classIdsReachingSource.has(courseClass.classId)) {
          disabledReason = MAKEUP_DISABLED_REASON_CYCLE
        }
      }

      return new CourseClassMakeupCandidateResponseDto({
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

  return new CourseClassMakeupOptionsResponseDto({ sourceClassId, courseId, candidates })
}
