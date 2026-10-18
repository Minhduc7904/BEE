import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentTuitionReadService } from '../../interfaces'
import { ParentTuitionPaymentDetailDto } from '../../dtos/parent-student-tuition'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { assertParentManagesStudent } from './parent-student-tuition-access'

@Injectable()
export class GetParentStudentTuitionPaymentDetailUseCase {
  constructor(private readonly tuition: ParentStudentTuitionReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    paymentId: number,
    now: Date = new Date(),
  ): Promise<BaseResponseDto<ParentTuitionPaymentDetailDto>> {
    await assertParentManagesStudent(identity, studentId, this.tuition)
    const detail = await this.tuition.findPaymentDetail(studentId, paymentId)
    if (!detail) {
      throw new NotFoundException(`Không tìm thấy học phí với ID ${paymentId}`)
    }

    return BaseResponseDto.success(
      'Lấy chi tiết học phí thành công',
      ParentTuitionPaymentDetailDto.fromDetailRecord(detail, now),
    )
  }
}
