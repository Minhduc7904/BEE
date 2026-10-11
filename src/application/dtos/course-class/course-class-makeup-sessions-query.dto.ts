import { Matches } from 'class-validator'

import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class CourseClassMakeupSessionsQueryDto {
  /** Thứ Hai đầu tuần cần xem, dạng YYYY-MM-DD; use case kiểm tra thêm đúng là Thứ Hai. */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày bắt đầu tuần'),
  })
  weekStart: string
}
