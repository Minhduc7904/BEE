import { Inject, Injectable } from '@nestjs/common'
import { BaseResponseDto, TuitionPaymentResponseDto, UpdateTuitionPaymentDto } from 'src/application/dtos'
import type { IUnitOfWork } from 'src/domain/repositories/unit-of-work.repository'
import {
  NotFoundException,
  InvalidStateException,
  UnauthorizedException,
} from 'src/shared/exceptions/custom-exceptions'
import { ACTION_KEYS } from 'src/shared/constants/action-key.constants'
import { RESOURCE_TYPES } from 'src/shared/constants/resource-type.constants'
import { AuditStatus } from 'src/shared/enums/audit-status.enum'
import { UpdateTuitionPaymentData } from 'src/domain/interface/tuition-payment/tuition-payment.interface'
import { TuitionPaymentStatus, NotificationType, NotificationLevel, TuitionPaymentStatusLabels } from 'src/shared/enums'
import { CreateAndNotifyOneUseCase } from '../notification/create-and-notify-one.use-case'

@Injectable()
export class UpdateTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
    private readonly createAndNotifyOne: CreateAndNotifyOneUseCase,
  ) {}

  /**
   * Helper: Strip time from date (set to 00:00:00)
   */
  private getDateWithoutTime(date: Date = new Date()): Date {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  async execute(
    dto: UpdateTuitionPaymentDto,
    tuitionPaymentId: number,
    adminId?: number,
  ): Promise<BaseResponseDto<TuitionPaymentResponseDto>> {
    if (!adminId) {
      throw new UnauthorizedException('Admin không hợp lệ')
    }

    const result = await this.unitOfWork.executeInTransaction(async (repos) => {
      const tuitionPaymentRepository = repos.tuitionPaymentRepository
      const adminAuditLogRepository = repos.adminAuditLogRepository

      /**
       * =========================
       * Load entity
       * =========================
       */
      const tuitionPayment = await tuitionPaymentRepository.findById(tuitionPaymentId)

      if (!tuitionPayment) {
        await adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.TUITION_PAYMENT.UPDATE,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
          resourceId: tuitionPaymentId.toString(),
          errorMessage: `Học phí với ID ${tuitionPaymentId} không tồn tại`,
        })
        throw new NotFoundException(`Học phí với ID ${tuitionPaymentId} không tồn tại`)
      }

      // Clone trước khi update để audit
      const beforeData = { ...tuitionPayment }

      /**
       * =========================
       * Build update data (SAFE)
       * =========================
       */
      const data: UpdateTuitionPaymentData = {
        notes: dto.notes,
      }

      // Update amount if provided
      if (dto.amount !== undefined) {
        data.amount = dto.amount
      }

      // Update status nếu có
      if (dto.status) {
        data.status = dto.status
      }

      // Update month/year chỉ khi chưa PAID
      if (tuitionPayment.status !== TuitionPaymentStatus.PAID) {
        if (dto.month !== undefined) data.month = dto.month
        if (dto.year !== undefined) data.year = dto.year
      }

      /**
       * Logic xử lý paidAt:
       * 1. Nếu status = PAID:
       *    - Nếu có dto.paidAt -> dùng dto.paidAt
       *    - Nếu không có dto.paidAt và DB chưa có paidAt -> set hiện tại
       *    - Nếu không có dto.paidAt và DB đã có paidAt -> giữ nguyên (không update)
       * 2. Nếu status = UNPAID:
       *    - Gỡ paidAt (set null)
       */
      if (dto.status === TuitionPaymentStatus.PAID) {
        if (dto.paidAt) {
          // Manual set paidAt
          data.paidAt = new Date(dto.paidAt)
        } else if (!tuitionPayment.paidAt) {
          // Auto set paidAt nếu chưa có
          data.paidAt = this.getDateWithoutTime()
        }
        // Nếu có dto.paidAt hoặc DB đã có paidAt -> không set data.paidAt (giữ nguyên)
      } else if (dto.status === TuitionPaymentStatus.UNPAID) {
        // Gỡ paidAt khi UNPAID
        data.paidAt = null
      }

      /**
       * =========================
       * Persist
       * =========================
       */
      const updatedTuitionPayment = await tuitionPaymentRepository.update(tuitionPaymentId, data)
      if (!updatedTuitionPayment) {
        throw new NotFoundException(`Cập nhật học phí thất bại, không tìm thấy học phí với ID ${tuitionPaymentId}`)
      }
      /**
       * =========================
       * Audit SUCCESS
       * =========================
       */
      await adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.TUITION_PAYMENT.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.TUITION_PAYMENT,
        resourceId: updatedTuitionPayment.paymentId.toString(),
        beforeData,
        afterData: updatedTuitionPayment,
      })

      // Gửi thông báo cho học sinh
      const student = await repos.studentRepository.findById(updatedTuitionPayment.studentId)
      if (student) {
        const statusLabel = TuitionPaymentStatusLabels[updatedTuitionPayment.status] || updatedTuitionPayment.status
        this.createAndNotifyOne.execute({
          userId: student.userId,
          title: 'Cập nhật học phí',
          message: `Học phí tháng ${updatedTuitionPayment.month}/${updatedTuitionPayment.year} đã được cập nhật - Số tiền: ${updatedTuitionPayment.amount?.toLocaleString('vi-VN')}đ - Trạng thái: ${statusLabel}`,
          type: NotificationType.TUITION,
          level: NotificationLevel.INFO,
          data: { paymentId: updatedTuitionPayment.paymentId, amount: updatedTuitionPayment.amount, month: updatedTuitionPayment.month, year: updatedTuitionPayment.year, status: updatedTuitionPayment.status },
        }).catch(() => { /* ignore notification error */ })
      }

      return new TuitionPaymentResponseDto(updatedTuitionPayment)
    })

    return BaseResponseDto.success('Cập nhật học phí thành công', result)
  }
}
