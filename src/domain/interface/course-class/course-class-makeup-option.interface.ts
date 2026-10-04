/**
 * Cạnh có hướng trong graph học bù: học sinh của lớp nguồn có thể sang học bù ở lớp đích.
 */
export interface CourseClassMakeupEdge {
  sourceClassId: number
  makeupClassId: number
}

/**
 * Thông tin tối thiểu của một lớp trong cùng course để Admin chọn làm lớp học bù.
 */
export interface CourseClassMakeupCandidate {
  classId: number
  className: string
  weeklySchedule: string | null
  startDate: Date | null
  endDate: Date | null
  room: string | null
  instructorName: string | null
}

/**
 * Kết quả locking read lớp nguồn: đủ để xác định course cần khóa tiếp theo.
 */
export interface LockedMakeupSourceClass {
  classId: number
  courseId: number
}
