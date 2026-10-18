import { Inject, Injectable } from '@nestjs/common'

import { TuitionPaymentIntentStatusResponseDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories'
import { ForbiddenException, NotFoundException, UnauthorizedException } from 'src/shared/exceptions/custom-exceptions'

export interface ParentTuitionPaymentIntentSubscription {
  studentId: number
  intent: TuitionPaymentIntentStatusResponseDto
}

/**
 * Xác minh phụ huynh được phép theo dõi payment intent (khoản học phí thuộc học sinh có liên kết ParentStudent)
 * và trả snapshot hiện tại. Dùng cho Socket subscribe; quyền được kiểm tra mỗi lần gọi, gồm cả lần đọc lại sau khi join.
 */
@Injectable()
export class GetParentTuitionPaymentIntentStatusUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async getByPaymentIntentId(
    paymentIntentId: number,
    parentId?: number,
  ): Promise<ParentTuitionPaymentIntentSubscription> {
    if (!parentId) {
      throw new UnauthorizedException('Chỉ phụ huynh mới được phép theo dõi thanh toán học phí của học sinh')
    }

    return this.unitOfWork.executeInTransaction(async (repos) => {
      const paymentIntent = await repos.paymentIntentRepository.findById(paymentIntentId)
      if (!paymentIntent) {
        throw new NotFoundException(`Payment intent với ID ${paymentIntentId} không tồn tại`)
      }
      if (!paymentIntent.tuitionPaymentId) {
        throw new NotFoundException('Payment intent này không thuộc thanh toán học phí')
      }

      const tuitionPayment = await repos.tuitionPaymentRepository.findById(paymentIntent.tuitionPaymentId)
      if (!tuitionPayment) {
        throw new NotFoundException(`Học phí với ID ${paymentIntent.tuitionPaymentId} không tồn tại`)
      }
      if (!(await repos.parentStudentRepository.exists(parentId, tuitionPayment.studentId))) {
        throw new ForbiddenException('Bạn không có quyền truy cập payment intent này')
      }

      return {
        studentId: tuitionPayment.studentId,
        intent: TuitionPaymentIntentStatusResponseDto.fromEntities(tuitionPayment, paymentIntent),
      }
    })
  }
}
