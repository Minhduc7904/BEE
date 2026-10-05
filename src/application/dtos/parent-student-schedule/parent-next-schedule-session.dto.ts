import type { ParentScheduleSession } from '../../interfaces'
import type { ParentScheduleStatus } from '../../../shared/enums/parent-schedule-status.enum'
import { ParentScheduleSessionDto } from './parent-schedule-session.dto'

export class ParentNextScheduleSessionDto extends ParentScheduleSessionDto {
  scheduleStatus: ParentScheduleStatus

  static fromNext(result: ParentScheduleSession, scheduleStatus: ParentScheduleStatus): ParentNextScheduleSessionDto {
    return {
      ...ParentScheduleSessionDto.fromResult(result),
      scheduleStatus,
    }
  }
}
