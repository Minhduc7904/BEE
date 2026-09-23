import { Inject, Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, ParentStudentSummaryDto } from '../../dtos'
import { ParentStudentSummaryService } from '../auth/parent'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../shared/utils'

@Injectable()
export class GetAvailableParentStudentsUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly studentSummaryService: ParentStudentSummaryService,
  ) {}

  async execute(identity: AuthenticatedUser): Promise<BaseResponseDto<ParentStudentSummaryDto[]>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem danh sách học sinh')
    }

    const students = await this.unitOfWork.executeInTransaction(async (repos) => {
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

      const [matchedStudents, linkedStudents] = await Promise.all([
        repos.studentRepository.findAllByParentPhoneVariants(PhoneUtil.vietnamesePhoneVariants(parent.phone)),
        repos.parentStudentRepository.findByParentId(parent.parentId),
      ])
      const linkedStudentIds = new Set(linkedStudents.map((link) => link.studentId))

      return matchedStudents.filter((student) => student.isActive() && !linkedStudentIds.has(student.studentId))
    })

    return BaseResponseDto.success(
      'Lấy danh sách học sinh có thể liên kết thành công',
      await this.studentSummaryService.createMany(students),
    )
  }
}
