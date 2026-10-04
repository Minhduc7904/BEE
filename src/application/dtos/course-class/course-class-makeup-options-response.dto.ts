export class CourseClassMakeupCandidateResponseDto {
  classId: number
  className: string
  weeklySchedule: string | null
  startDate: string | null
  endDate: string | null
  room: string | null
  instructorName: string | null
  selected: boolean
  isExpired: boolean
  disabled: boolean
  disabledReason: string | null

  constructor(data: CourseClassMakeupCandidateResponseDto) {
    Object.assign(this, data)
  }
}

export class CourseClassMakeupOptionsResponseDto {
  sourceClassId: number
  courseId: number
  candidates: CourseClassMakeupCandidateResponseDto[]

  constructor(data: CourseClassMakeupOptionsResponseDto) {
    Object.assign(this, data)
  }
}
