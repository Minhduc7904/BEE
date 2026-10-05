import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentScheduleReadService } from '../../interfaces'
import { ParentNextScheduleSessionDto } from '../../dtos/parent-student-schedule'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'
import { resolveScheduleStatus, resolveVietnamClock } from './parent-student-schedule-week'

@Injectable()
export class GetParentStudentNextScheduleSessionUseCase {
  constructor(private readonly schedule: ParentStudentScheduleReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    now: Date = new Date(),
  ): Promise<BaseResponseDto<ParentNextScheduleSessionDto | null>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem lịch học của học sinh')
    }
    if (!(await this.schedule.isStudentLinked(identity.parentId, studentId))) {
      throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
    }

    const clock = resolveVietnamClock(now)
    const session = await this.schedule.findNextSession(studentId, clock)
    if (!session) {
      return BaseResponseDto.success('Không có buổi học sắp tới', null)
    }

    return BaseResponseDto.success(
      'Lấy buổi học tiếp theo thành công',
      ParentNextScheduleSessionDto.fromNext(session, resolveScheduleStatus(session, clock)),
    )
  }
}
