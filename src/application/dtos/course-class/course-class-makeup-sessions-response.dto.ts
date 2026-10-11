export class CourseClassMakeupSessionItemDto {
  sessionId: number
  classId: number
  className: string
  name: string
  /** Ngày học dạng YYYY-MM-DD (cột DATE, không phụ thuộc múi giờ). */
  sessionDate: string
  startTime: Date
  endTime: Date

  constructor(data: CourseClassMakeupSessionItemDto) {
    Object.assign(this, data)
  }
}

export class CourseClassMakeupSessionDto extends CourseClassMakeupSessionItemDto {
  /** Các buổi của lớp khác trong nhóm, cùng tuần, có thể học bù cho buổi này. */
  makeupCandidates: CourseClassMakeupSessionItemDto[]

  constructor(data: CourseClassMakeupSessionDto) {
    super(data)
    this.makeupCandidates = data.makeupCandidates
  }
}

export class CourseClassMakeupSessionsResponseDto {
  sourceClassId: number
  courseId: number
  /** ID nhóm học bù hiệu lực của lớp nguồn; `null` khi lớp chưa thuộc nhóm nào (hoặc nhóm còn dưới 2 lớp). */
  groupId: number | null
  /** Thứ Hai và Chủ Nhật của tuần, dạng YYYY-MM-DD. */
  weekStart: string
  weekEnd: string
  /** Buổi của lớp nguồn trong tuần, kèm các buổi có thể học bù. */
  sessions: CourseClassMakeupSessionDto[]

  constructor(data: CourseClassMakeupSessionsResponseDto) {
    Object.assign(this, data)
  }
}
