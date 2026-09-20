import { Inject, Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { BaseResponseDto, ParentResponseDto } from '../../dtos'
import { ParentStudentSummaryService } from '../auth/parent'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetParentProfileUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly studentSummaryService: ParentStudentSummaryService,
  ) {}

  async execute(identity: AuthenticatedUser): Promise<BaseResponseDto<ParentResponseDto>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể truy cập hồ sơ này')
    }

    const parent = await this.unitOfWork.executeInTransaction((repos) =>
      repos.parentRepository.findByUserId(identity.userId, {
        includeUser: true,
        includeStudents: true,
      }),
    )

    if (!parent?.user) {
      throw new NotFoundException('Không tìm thấy hồ sơ phụ huynh')
    }

    if (parent.parentId !== identity.parentId) {
      throw new ForbiddenException('Phiên đăng nhập phụ huynh không hợp lệ')
    }

    if (!parent.user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa')
    }

    const linkedStudents = (parent.studentLinks ?? [])
      .map((link) => link.student)
      .filter((student): student is NonNullable<typeof student> => Boolean(student))
      .sort((left, right) => left.studentId - right.studentId)
    const students = await this.studentSummaryService.createMany(linkedStudents)

    return BaseResponseDto.success('Lấy thông tin phụ huynh thành công', ParentResponseDto.fromParent(parent, students))
  }
}
