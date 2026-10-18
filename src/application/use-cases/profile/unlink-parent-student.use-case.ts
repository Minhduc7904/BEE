import { Inject, Injectable, Logger } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentRealtimeRevocationService } from '../../interfaces/parent-student-realtime-revocation.interface'
import type { IParentStudentRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UnlinkParentStudentUseCase {
  private readonly logger = new Logger(UnlinkParentStudentUseCase.name)

  constructor(
    @Inject('IParentStudentRepository') private readonly parentStudentRepository: IParentStudentRepository,
    private readonly realtimeRevocation: ParentStudentRealtimeRevocationService,
  ) {}

  async execute(identity: AuthenticatedUser, studentId: number): Promise<BaseResponseDto<{ unlinked: boolean }>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể gỡ liên kết học sinh')
    }

    if (!(await this.parentStudentRepository.exists(identity.parentId, studentId))) {
      throw new NotFoundException('Học sinh chưa được liên kết với tài khoản phụ huynh')
    }

    await this.parentStudentRepository.delete(identity.parentId, studentId)
    await this.revokeRealtimeAccess(identity.userId, studentId)

    return BaseResponseDto.success('Gỡ liên kết học sinh thành công', { unlinked: true })
  }

  /**
   * Socket đã subscribe trước khi gỡ liên kết phải rời room ngay. Lỗi ở đây không được làm hỏng việc gỡ liên kết
   * (REST luôn kiểm tra lại liên kết ở mỗi request) nên chỉ ghi log.
   */
  private async revokeRealtimeAccess(parentUserId: number, studentId: number): Promise<void> {
    try {
      await this.realtimeRevocation.revokeStudentAccess(parentUserId, studentId)
    } catch (error) {
      this.logger.warn(`Không thể thu hồi realtime của phụ huynh ${parentUserId} với học sinh ${studentId}: ${String(error)}`)
    }
  }
}
