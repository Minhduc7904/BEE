import { Inject, Injectable } from '@nestjs/common'

import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentTuitionReadService } from '../../interfaces'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ParentTuitionPaymentStatusSnapshotDto } from '../../dtos/parent-student-tuition'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { TuitionPaymentIntentEligibility } from '../payment-intent/tuition-payment-intent-eligibility'
import { TuitionPaymentStatus } from '../../../shared/enums'
import {
  BusinessLogicException,
  InvalidStateException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { assertParentManagesStudent } from './parent-student-tuition-access'

/**
 * Phụ huynh báo đã chuyển khoản. Cờ chỉ là tín hiệu để trung tâm kiểm tra, không đổi trạng thái thanh toán.
 *
 * Quy tắc:
 * - Chỉ phụ huynh quản lý học sinh; khoản học phí còn UNPAID và số tiền > 0.
 * - Khoản học phí phải từng có ít nhất một PaymentAttempt (chứng minh màn QR đã từng được mở).
 * - Idempotent: gọi lặp không đổi timestamp. Ghi cờ bằng conditional update nguyên tử nên không thể "treo"
 *   cờ sau khi khoản học phí đã PAID (mọi đường PAID đều xóa cờ trong cùng câu lệnh UPDATE).
 * - Khoản học phí đã PAID trong lúc thao tác: không ghi cờ, trả snapshot PAID.
 */
@Injectable()
export class ReportParentStudentTuitionTransferredUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly tuition: ParentStudentTuitionReadService,
  ) {}

  async execute(
    identity: AuthenticatedUser,
    studentId: number,
    paymentId: number,
    now: Date = new Date(),
  ): Promise<BaseResponseDto<ParentTuitionPaymentStatusSnapshotDto>> {
    await assertParentManagesStudent(identity, studentId, this.tuition)

    await this.unitOfWork.executeInTransaction(async (repos) => {
      const payment = await repos.tuitionPaymentRepository.findById(paymentId)
      if (!payment || payment.studentId !== studentId) {
        throw new NotFoundException(`Không tìm thấy học phí với ID ${paymentId}`)
      }
      // Đã PAID hoặc đã báo trước đó: không ghi gì, snapshot bên dưới phản ánh trạng thái hiện hành.
      if (payment.isPaid() || payment.hasPayerReportedTransfer()) return

      TuitionPaymentIntentEligibility.assertPayable(payment)
      const intent = await repos.paymentIntentRepository.findByTuitionPaymentId(paymentId)
      const attempts = intent
        ? await repos.paymentAttemptRepository.findAll({ paymentIntentId: intent.paymentIntentId, take: 1 })
        : []
      if (attempts.length === 0) {
        throw new BusinessLogicException('Vui lòng mở mã QR thanh toán trước khi báo đã chuyển khoản')
      }

      const written = await repos.tuitionPaymentRepository.reportPayerTransferred(paymentId, identity.userId, now)
      if (written) return

      // Không ghi được: khoản học phí vừa đổi trạng thái hoặc có lần báo khác thắng cuộc đua.
      const current = await repos.tuitionPaymentRepository.findById(paymentId)
      if (!current || current.isPaid() || current.hasPayerReportedTransfer()) return
      throw new InvalidStateException('Học phí này hiện không thể báo đã chuyển khoản')
    })

    const snapshot = await this.tuition.findPaymentDetail(studentId, paymentId)
    if (!snapshot) {
      throw new NotFoundException(`Không tìm thấy học phí với ID ${paymentId}`)
    }

    return BaseResponseDto.success(
      snapshot.status === TuitionPaymentStatus.PAID ? 'Học phí đã được thanh toán' : 'Đã ghi nhận báo chuyển khoản',
      ParentTuitionPaymentStatusSnapshotDto.fromRecord(snapshot),
    )
  }
}
