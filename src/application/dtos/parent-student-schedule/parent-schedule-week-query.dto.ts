import { Matches } from 'class-validator'

import { VALIDATION_MESSAGES } from '../../../shared/constants'

export class ParentScheduleWeekQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: VALIDATION_MESSAGES.FIELD_INVALID('Ngày bắt đầu tuần'),
  })
  weekStart: string
}
