import { Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentTuitionReadService } from '../../interfaces'
import { BaseResponseDto, PaymentInstructionResponseDto } from '../../dtos'
import { GetMyTuitionPaymentInstructionsUseCase } from '../payment-attempt/get-my-tuition-payment-instructions.use-case'
import { assertParentManagesStudent } from './parent-student-tuition-access'

/**
 * Dùng chung nghiệp vụ tạo/tái sử dụng QR với luồng học sinh sau khi đã xác nhận phụ huynh quản lý học sinh.
 * Có side effect: tạo payment intent (khoản cũ chưa có) hoặc payment attempt mới khi attempt cũ sắp/đã hết hạn.
 */
@Injectable()
export class GetParentStudentTuitionPaymentInstructionsUseCase {
  constructor(
    private readonly tuition: ParentStudentTuitionReadService,
    private readonly studentInstructions: GetMyTuitionPaymentInstructionsUseCase,
  ) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    paymentId: number,
  ): Promise<BaseResponseDto<PaymentInstructionResponseDto>> {
    await assertParentManagesStudent(identity, studentId, this.tuition)
    return this.studentInstructions.execute(paymentId, studentId)
  }
}
