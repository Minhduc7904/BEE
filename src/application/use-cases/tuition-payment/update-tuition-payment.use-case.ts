import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto, UpdateTuitionPaymentDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories/unit-of-work.repository'
import {
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  InvalidStateException,
} from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { UpdateTuitionPaymentData } from 'src/domain/interface/tuition-payment/tuition-payment.interface'
import { PaymentAttemptStatus, TuitionPaymentStatus, NotificationType, NotificationLevel } from 'src/shared/enums'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'
import { CreatePaymentIntentForCreatedTuitionPayment } from '../payment-intent/create-payment-intent-for-created-tuition-payment'

const EXPIRED_ATTEMPT_OFFSET_MS = 1000

@Injectable()
export class UpdateTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
  ) {}

  async execute(
    dto: UpdateTuitionPaymentDto,
    tuitionPaymentId: number,
    adminId?: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    if (!adminId) {
      throw new UnauthorizedException('Admin không hợp lệ')
    }

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPayment = await repos.tuitionPaymentRepository.findById(tuitionPaymentId)
      if (!tuitionPayment) {
        await repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.UPDATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: tuitionPaymentId.toString(),
          errorMessage: `Học phí với ID ${tuitionPaymentId} không tồn tại`,
        })
        throw new NotFoundException(`Học phí với ID ${tuitionPaymentId} không tồn tại`)
      }

      if (tuitionPayment.status !== TuitionPaymentStatus.UNPAID) {
        throw new InvalidStateException('Chỉ có thể cập nhật học phí chưa thanh toán')
      }

      const paymentStudent = await repos.studentRepository.findById(tuitionPayment.studentId)
      if (paymentStudent && !paymentStudent.user?.isActive) {
        throw new ForbiddenException('Học sinh đã bị vô hiệu hóa, không thể cập nhật học phí')
      }

      const data: UpdateTuitionPaymentData = {}
      if (dto.amount !== undefined) data.amount = dto.amount
      if (dto.month !== undefined) data.month = dto.month
      if (dto.year !== undefined) data.year = dto.year

      const beforePaymentIntent = dto.amount === undefined
        ? null
        : await repos.paymentIntentRepository.findByTuitionPaymentId(tuitionPaymentId)
      const isAmountChanged = dto.amount !== undefined && dto.amount !== tuitionPayment.amount

      const updatedTuitionPayment = await repos.tuitionPaymentRepository.update(tuitionPaymentId, data)
      if (!updatedTuitionPayment) {
        throw new NotFoundException(`Cập nhật học phí thất bại, không tìm thấy học phí với ID ${tuitionPaymentId}`)
      }

      let updatedPaymentIntent = beforePaymentIntent
      const expiredPaymentAttemptIds: number[] = []
      if (dto.amount !== undefined) {
        if (beforePaymentIntent && isAmountChanged) {
          const pendingAttempts = await repos.paymentAttemptRepository.findAll({
            paymentIntentId: beforePaymentIntent.paymentIntentId,
            status: PaymentAttemptStatus.PENDING,
          })
          const expiresAt = new Date(Date.now() - EXPIRED_ATTEMPT_OFFSET_MS)
          for (const pendingAttempt of pendingAttempts) {
            await repos.paymentAttemptRepository.update(pendingAttempt.paymentAttemptId, {
              status: PaymentAttemptStatus.EXPIRED,
              expiresAt,
            })
            expiredPaymentAttemptIds.push(pendingAttempt.paymentAttemptId)
          }
        }

        updatedPaymentIntent = beforePaymentIntent
          ? await repos.paymentIntentRepository.update(beforePaymentIntent.paymentIntentId, {
              amount: updatedTuitionPayment.amount!,
            })
          : await CreatePaymentIntentForCreatedTuitionPayment.execute(repos, updatedTuitionPayment)
      }

      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.TUITION_PAYMENT.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
        resourceId: updatedTuitionPayment.paymentId.toString(),
        beforeData: {
          tuitionPayment,
          paymentIntent: beforePaymentIntent,
        },
        afterData: {
          tuitionPayment: updatedTuitionPayment,
          paymentIntent: updatedPaymentIntent,
          expiredPaymentAttemptIds,
        },
      })

      const student = await repos.studentRepository.findById(updatedTuitionPayment.studentId)
      return {
        response: new TuitionPaymentResponseDto(updatedTuitionPayment),
        studentUserId: student?.userId,
      }
    })

    if (result.studentUserId) {
      this.createAndNotifyOne.execute({
        userId: result.studentUserId,
        title: 'Cập nhật học phí',
        message: `Học phí tháng ${result.response.month}/${result.response.year} đã được cập nhật - Số tiền: ${result.response.amount?.toLocaleString('vi-VN')}đ - Trạng thái: ${result.response.statusLabel}`,
        type: NotificationType.TUITION,
        level: NotificationLevel.INFO,
        data: {
          paymentId: result.response.paymentId,
          amount: result.response.amount,
          month: result.response.month,
          year: result.response.year,
          status: result.response.status,
          shouldShowReminderModal: true,
        },
      }).catch(() => { /* ignore notification error */ })
    }

    return BaseResponseDto.success('Cập nhật học phí thành công', result.response)
  }
}
