import { BaseResponseDto } from '../common/base-response.dto'

export class CourseClassLessonResponseDto {
  classId: number
  lessonId: number
  displayOrder?: number
  isVisible: boolean
  availableFrom?: Date
  availableUntil?: Date
  createdAt: Date
  updatedAt: Date
  action: 'CREATED' | 'UPDATED'

  static fromPrisma(courseClassLesson: any, action: 'CREATED' | 'UPDATED'): CourseClassLessonResponseDto {
    const dto = new CourseClassLessonResponseDto()
    dto.classId = courseClassLesson.classId
    dto.lessonId = courseClassLesson.lessonId
    dto.displayOrder = courseClassLesson.displayOrder ?? undefined
    dto.isVisible = courseClassLesson.isVisible
    dto.availableFrom = courseClassLesson.availableFrom ?? undefined
    dto.availableUntil = courseClassLesson.availableUntil ?? undefined
    dto.createdAt = courseClassLesson.createdAt
    dto.updatedAt = courseClassLesson.updatedAt
    dto.action = action
    return dto
  }
}

export class CourseClassLessonBaseResponseDto extends BaseResponseDto<CourseClassLessonResponseDto> { }
