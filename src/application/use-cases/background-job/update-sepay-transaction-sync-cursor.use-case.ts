import { Inject, Injectable } from '@nestjs/common'

import { BaseResponseDto, SepayTransactionSyncCursorResponseDto, UpdateSepayTransactionSyncCursorDto } from '../../dtos'
import { SepayTransactionSyncCursor } from '../../../domain/entities/sepay'
import type { UpdateSepayTransactionSyncCursorData } from '../../../domain/interface/sepay'
import type { IUnitOfWork } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import {
  BusinessLogicException,
  ConflictException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { AuditStatus, BackgroundJobCode } from '../../../shared/enums'

@Injectable()
export class UpdateSepayTransactionSyncCursorUseCase {
  constructor(@Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork) {}

  async execute(
    scope: string,
    dto: UpdateSepayTransactionSyncCursorDto,
    adminId: number,
  ): Promise<BaseResponseDto<SepayTransactionSyncCursorResponseDto>> {
    if (!dto.hasChanges()) {
      throw new BusinessLogicException('Cần cung cấp ít nhất một trường để cập nhật cursor đồng bộ SePay')
    }

    const response = await this.unitOfWork.executeInTransaction(async (repos) => {
      const current = await repos.sepayTransactionSyncCursorRepository.findByScope(scope)
      if (!current) throw new NotFoundException(`Không tìm thấy cursor đồng bộ SePay với scope ${scope}`)

      const syncJob = await repos.backgroundJobRepository.findByCode(BackgroundJobCode.SEPAY_TRANSACTION_SYNC)
      if (syncJob) {
        const lock = await repos.backgroundJobLockRepository.findByBackgroundJobId(syncJob.backgroundJobId)
        if (lock?.isActive()) {
          throw new ConflictException('Không thể cập nhật cursor khi đồng bộ SePay đang chạy')
        }
      }

      const updateData = dto.toUpdateData()
      if (!this.hasChanged(current, updateData)) {
        return SepayTransactionSyncCursorResponseDto.fromSepayTransactionSyncCursor(current)
      }

      const updated = await repos.sepayTransactionSyncCursorRepository.updateByScope(scope, updateData)
      await repos.adminAuditLogRepository.create({
        adminId,
        actionKey: ACTION_KEYS.BACKGROUND_JOB.UPDATE,
        resourceType: RESOURCE_TYPES.BACKGROUND_JOB,
        resourceId: scope,
        status: AuditStatus.SUCCESS,
        beforeData: this.toAuditData(current),
        afterData: this.toAuditData(updated),
      })

      return SepayTransactionSyncCursorResponseDto.fromSepayTransactionSyncCursor(updated)
    })

    return BaseResponseDto.success('Cập nhật cursor đồng bộ SePay thành công', response)
  }

  private hasChanged(cursor: SepayTransactionSyncCursor, updateData: UpdateSepayTransactionSyncCursorData): boolean {
    return (
      (updateData.lastSinceId !== undefined && updateData.lastSinceId !== cursor.lastSinceId) ||
      (updateData.lastSyncedAt !== undefined && !this.areDatesEqual(updateData.lastSyncedAt, cursor.lastSyncedAt)) ||
      (updateData.lastErrorAt !== undefined && !this.areDatesEqual(updateData.lastErrorAt, cursor.lastErrorAt)) ||
      (updateData.lastErrorMessage !== undefined && updateData.lastErrorMessage !== cursor.lastErrorMessage)
    )
  }

  private areDatesEqual(left?: Date | null, right?: Date | null): boolean {
    if (left === right) return true
    if (!left || !right) return false
    return left.getTime() === right.getTime()
  }

  private toAuditData(cursor: SepayTransactionSyncCursor) {
    return {
      resource: 'SEPAY_TRANSACTION_SYNC_CURSOR',
      sepayTransactionSyncCursorId: cursor.sepayTransactionSyncCursorId,
      scope: cursor.scope,
      lastSinceId: cursor.lastSinceId,
      lastSyncedAt: cursor.lastSyncedAt,
      lastErrorAt: cursor.lastErrorAt,
      lastErrorMessage: cursor.lastErrorMessage,
    }
  }
}
