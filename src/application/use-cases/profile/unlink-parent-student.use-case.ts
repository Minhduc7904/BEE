import { Inject, Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import type { IParentStudentRepository } from '../../../domain/repositories'
import { BaseResponseDto } from '../../dtos'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class UnlinkParentStudentUseCase {
  constructor(@Inject('IParentStudentRepository') private readonly parentStudentRepository: IParentStudentRepository) {}

  async execute(identity: AuthenticatedUser, studentId: number): Promise<BaseResponseDto<{ unlinked: boolean }>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể gỡ liên kết học sinh')
    }

    if (!(await this.parentStudentRepository.exists(identity.parentId, studentId))) {
      throw new NotFoundException('Học sinh chưa được liên kết với tài khoản phụ huynh')
    }

    await this.parentStudentRepository.delete(identity.parentId, studentId)

    return BaseResponseDto.success('Gỡ liên kết học sinh thành công', { unlinked: true })
  }
}
