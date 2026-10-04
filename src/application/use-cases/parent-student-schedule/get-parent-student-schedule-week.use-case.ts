import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentScheduleReadService } from '../../interfaces'
import { ParentScheduleWeekDto, ParentScheduleWeekQueryDto } from '../../dtos/parent-student-schedule'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { resolveScheduleWeek } from './parent-student-schedule-week'

@Injectable()
export class GetParentStudentScheduleWeekUseCase {
  constructor(private readonly schedule: ParentStudentScheduleReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    query: ParentScheduleWeekQueryDto,
  ): Promise<BaseResponseDto<ParentScheduleWeekDto>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem lịch học của học sinh')
    }
    if (!(await this.schedule.isStudentLinked(identity.parentId, studentId))) {
      throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
    }

    const week = resolveScheduleWeek(query.weekStart)
    const sessions = await this.schedule.listSessionsInRange(studentId, week.from, week.to)

    return BaseResponseDto.success(
      'Lấy lịch học của học sinh thành công',
      ParentScheduleWeekDto.fromResult(studentId, week.weekStart, week.weekEnd, sessions),
    )
  }
}
