export class CourseClassMakeupGroupCandidateResponseDto {
  classId: number
  className: string
  weeklySchedule: string | null
  startDate: string | null
  endDate: string | null
  room: string | null
  instructorName: string | null
  /** Lớp đang cùng nhóm học bù với lớp nguồn. */
  selected: boolean
  isExpired: boolean
  disabled: boolean
  disabledReason: string | null

  constructor(data: CourseClassMakeupGroupCandidateResponseDto) {
    Object.assign(this, data)
  }
}

export class CourseClassMakeupGroupResponseDto {
  sourceClassId: number
  courseId: number
  /** ID nhóm của lớp nguồn; `null` khi lớp chưa thuộc nhóm học bù nào. */
  groupId: number | null
  candidates: CourseClassMakeupGroupCandidateResponseDto[]

  constructor(data: CourseClassMakeupGroupResponseDto) {
    Object.assign(this, data)
  }
}
