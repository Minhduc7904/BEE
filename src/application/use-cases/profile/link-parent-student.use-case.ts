import { Inject, Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, ParentStudentSummaryDto } from '../../dtos'
import { ParentStudentSummaryService } from '../auth/parent'
import { ConflictException, ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../shared/utils'

@Injectable()
export class LinkParentStudentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly studentSummaryService: ParentStudentSummaryService,
  ) {}

  async execute(identity: AuthenticatedUser, studentId: number): Promise<BaseResponseDto<ParentStudentSummaryDto>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể liên kết học sinh')
    }

    const student = await this.unitOfWork.executeInTransaction(async (repos) => {
      const parent = await repos.parentRepository.findByUserId(identity.userId, {
        includeUser: true,
      })

      if (!parent?.user) {
        throw new NotFoundException('Không tìm thấy hồ sơ phụ huynh')
      }

      if (parent.parentId !== identity.parentId) {
        throw new ForbiddenException('Phiên đăng nhập phụ huynh không hợp lệ')
      }

      if (!parent.user.isActive) {
        throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
      }

      if (await repos.parentStudentRepository.exists(parent.parentId, studentId)) {
        throw new ConflictException('Học sinh đã được liên kết với tài khoản phụ huynh')
      }

      const [matchedStudent] = await repos.studentRepository.findAllByIdsAndParentPhoneVariants(
        [studentId],
        PhoneUtil.vietnamesePhoneVariants(parent.phone),
      )

      if (!matchedStudent || !matchedStudent.isActive()) {
        throw new ForbiddenException('Học sinh không hoạt động hoặc không thuộc số điện thoại của phụ huynh')
      }

      await repos.parentStudentRepository.createMany([
        { parentId: parent.parentId, studentId: matchedStudent.studentId },
      ])

      return matchedStudent
    })

    const [summary] = await this.studentSummaryService.createMany([student])
    return BaseResponseDto.success('Liên kết học sinh thành công', summary)
  }
}
