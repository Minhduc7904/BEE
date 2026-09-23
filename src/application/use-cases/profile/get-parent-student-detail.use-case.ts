import { Inject, Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import type { IParentStudentRepository } from '../../../domain/repositories'
import { BaseResponseDto, StudentResponseDto } from '../../dtos'
import { GetStudentProfileUseCase } from './get-student-profile.use-case'
import { ForbiddenException } from '../../../shared/exceptions/custom-exceptions'

@Injectable()
export class GetParentStudentDetailUseCase {
  constructor(
    @Inject('IParentStudentRepository') private readonly parentStudentRepository: IParentStudentRepository,
    private readonly getStudentProfileUseCase: GetStudentProfileUseCase,
  ) {}

  async execute(identity: AuthenticatedUser, studentId: number): Promise<BaseResponseDto<StudentResponseDto>> {
    if (identity.userType !== 'parent' || !identity.parentId) {
      throw new ForbiddenException('Chỉ tài khoản phụ huynh mới có thể xem thông tin học sinh')
    }

    if (!(await this.parentStudentRepository.exists(identity.parentId, studentId))) {
      throw new ForbiddenException('Phụ huynh không quản lý học sinh này')
    }

    return this.getStudentProfileUseCase.execute({ studentId })
  }
}
