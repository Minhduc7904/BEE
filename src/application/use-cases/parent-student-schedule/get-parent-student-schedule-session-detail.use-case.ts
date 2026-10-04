import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentScheduleSessionDetailReadService, ParentStudentScheduleReadService } from '../../interfaces'
import { ParentScheduleSessionDetailDto } from '../../dtos/parent-student-schedule'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { resolveVietnamToday } from './parent-student-schedule-week'

@Injectable()
export class GetParentStudentScheduleSessionDetailUseCase {
  constructor(
    private readonly schedule: ParentStudentScheduleReadService,
    private readonly sessionDetail: ParentScheduleSessionDetailReadService,
  ) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    sessionId: number,
    now: Date = new Date(),
  ): Promise<BaseResponseDto<ParentScheduleSessionDetailDto>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem lịch học của học sinh')
    }
    if (!(await this.schedule.isStudentLinked(identity.parentId, studentId))) {
      throw new ForbiddenException('Phụ huynh không có quyền quản lý học sinh này')
    }

    const detail = await this.sessionDetail.findSessionDetail(studentId, sessionId, resolveVietnamToday(now))
    if (!detail) {
      // Cùng một lỗi cho "không tồn tại" và "ngoài phạm vi học sinh" để không lộ dữ liệu buổi học.
      throw new NotFoundException('Không tìm thấy buổi học')
    }

    return BaseResponseDto.success(
      'Lấy chi tiết buổi học của học sinh thành công',
      ParentScheduleSessionDetailDto.fromResult(studentId, detail),
    )
  }
}
