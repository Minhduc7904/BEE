import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentTuitionReadService } from '../../interfaces'
import { ParentTuitionPaymentStatusSnapshotDto } from '../../dtos/parent-student-tuition'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { assertParentManagesStudent } from './parent-student-tuition-access'

/**
 * Snapshot REST authoritative của trạng thái thanh toán. Khác API của học sinh, khoản học phí chưa từng mở QR
 * (chưa có payment intent) vẫn trả thành công với `paymentIntent: null` thay vì 404.
 */
@Injectable()
export class GetParentStudentTuitionPaymentStatusUseCase {
  constructor(private readonly tuition: ParentStudentTuitionReadService) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    paymentId: number,
  ): Promise<BaseResponseDto<ParentTuitionPaymentStatusSnapshotDto>> {
    await assertParentManagesStudent(identity, studentId, this.tuition)
    const detail = await this.tuition.findPaymentDetail(studentId, paymentId)
    if (!detail) {
      throw new NotFoundException(`Không tìm thấy học phí với ID ${paymentId}`)
    }

    return BaseResponseDto.success(
      'Lấy trạng thái thanh toán học phí thành công',
      ParentTuitionPaymentStatusSnapshotDto.fromRecord(detail),
    )
  }
}
