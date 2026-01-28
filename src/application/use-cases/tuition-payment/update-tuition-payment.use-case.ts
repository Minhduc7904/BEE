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
import { TuitionPaymentStatus } from 'src/shared/enums'

@Injectable()
export class UpdateTuitionPaymentUseCase {
  constructor(
    @Inject('UNIT_OF_WORK')
    private readonly unitOfWork: IUnitOfWork,
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
       * Domain rules (STATE)
       * =========================
       */
      if (tuitionPayment.status === TuitionPaymentStatus.PAID) {
        // ❌ Không cho đổi trạng thái
        if (dto.status && dto.status !== TuitionPaymentStatus.PAID) {
          throw new InvalidStateException('Không thể thay đổi trạng thái học phí đã thanh toán')
        }

        // ❌ Không cho đổi kỳ học
        if (dto.month !== undefined || dto.year !== undefined) {
          throw new InvalidStateException('Không thể thay đổi tháng/năm của học phí đã thanh toán')
        }
      }

      /**
       * =========================
       * Build update data (SAFE)
       * =========================
       */
      const data: UpdateTuitionPaymentData = {
        notes: dto.notes,
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

      // Set paidAt ONLY when UNPAID → PAID
      if (dto.status === TuitionPaymentStatus.PAID && !tuitionPayment.paidAt) {
        data.paidAt = new Date()
      }

      /**
       * =========================
       * Persist
       * =========================
       */
      const updatedTuitionPayment = await tuitionPaymentRepository.update(tuitionPaymentId, data)

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

      return new TuitionPaymentResponseDto(updatedTuitionPayment)
    })

    return BaseResponseDto.success('Cập nhật học phí thành công', result)
  }
}
