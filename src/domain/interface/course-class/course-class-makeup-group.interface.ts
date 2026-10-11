/** Mã lỗi khi lưu nhóm học bù xung đột với một thay đổi khác (lớp đã thuộc nhóm khác hoặc lưu đồng thời). */
export const COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE = 'COURSE_CLASS_MAKEUP_GROUP_CONFLICT'

/**
 * Thông tin tối thiểu của một lớp trong cùng khóa học để Admin chọn vào nhóm học bù.
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
 * Nhóm các lớp cùng khóa học có thể học bù cho nhau.
 */
export interface MakeupGroup {
  groupId: number
  memberClassIds: number[]
}

/**
 * Thay đổi cần ghi khi lưu nhóm học bù của một lớp có từ 1 lớp bạn học bù trở lên.
 */
export interface SaveMakeupGroupParams {
  /** Nhóm hiện tại của lớp nguồn; `null` khi lớp nguồn chưa thuộc nhóm nào và cần tạo nhóm mới. */
  groupId: number | null
  addClassIds: number[]
  removeClassIds: number[]
}
