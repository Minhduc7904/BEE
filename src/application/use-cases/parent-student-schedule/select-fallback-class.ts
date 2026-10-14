import type { ParentNextScheduleClass } from '../../interfaces'

function isActive(item: ParentNextScheduleClass, today: number): boolean {
  const started = item.classStartDate === null || item.classStartDate.getTime() <= today
  const notEnded = item.classEndDate === null || item.classEndDate.getTime() >= today
  return started && notEnded
}

/** endDate hữu hạn gần nhất trước, endDate null sau, rồi classId. */
function compareActive(left: ParentNextScheduleClass, right: ParentNextScheduleClass): number {
  if (left.classEndDate !== null && right.classEndDate !== null) {
    return left.classEndDate.getTime() - right.classEndDate.getTime() || left.classId - right.classId
  }
  if (left.classEndDate !== null) return -1
  if (right.classEndDate !== null) return 1
  return left.classId - right.classId
}

/**
 * Chọn lớp dự phòng khi học sinh không còn buổi học nào chưa kết thúc.
 *
 * 1. Lớp đang hoạt động: `(startDate null hoặc <= today)` và `(endDate null hoặc >= today)`,
 *    sắp xếp endDate hữu hạn gần nhất trước, endDate null sau, rồi classId.
 * 2. Không có lớp hoạt động: lớp có `startDate > today` gần nhất, rồi classId.
 * 3. Còn lại (mọi lớp đã kết thúc hoặc không có lớp): null.
 */
export function selectFallbackClass(classes: ParentNextScheduleClass[], today: Date): ParentNextScheduleClass | null {
  const todayMs = today.getTime()
  const active = classes.filter((item) => isActive(item, todayMs)).sort(compareActive)
  if (active.length > 0) return active[0]

  const future = classes
    .filter((item) => item.classStartDate !== null && item.classStartDate.getTime() > todayMs)
    .sort(
      (left, right) => left.classStartDate!.getTime() - right.classStartDate!.getTime() || left.classId - right.classId,
    )
  return future[0] ?? null
}
