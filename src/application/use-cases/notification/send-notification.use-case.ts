import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { ROLE_NAMES, type RoleName } from '../../../shared/constants/roles.constant'
import {
  AuditStatus,
  NotificationDeliveryChannel,
  NotificationLevel,
  NotificationType,
  TuitionPaymentStatus,
} from '../../../shared/enums'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { SendNotificationDto } from '../../dtos/notification/send-notification.dto'
import { EnqueueNotificationDispatchJobUseCase } from './enqueue-notification-dispatch-job.use-case'

interface NotificationTargets {
  userIds: number[]
  targetingMethod: string
}

@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly enqueueNotificationDispatchJob: EnqueueNotificationDispatchJobUseCase,
  ) {}

  async execute(dto: SendNotificationDto, adminId?: number): Promise<BaseResponseDto<{ count: number }>> {
    try {
      const targets = await this.unitOfWork.executeInTransaction((repos) => this.resolveTargets(dto, repos))
      const dispatch = await this.enqueueNotificationDispatchJob.execute({
        idempotencyKey: `admin-notification:${adminId ?? 'system'}:${randomUUID()}`,
        userIds: targets.userIds,
        channels: [NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH],
        title: dto.title,
        message: dto.message,
        type: dto.type ?? NotificationType.SYSTEM,
        level: dto.level ?? NotificationLevel.INFO,
        data: this.toStringData(dto.data),
        createdByAdminId: adminId,
      })

      if (adminId) {
        await this.unitOfWork.executeInTransaction((repos) =>
          repos.adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.NOTIFICATION.SEND,
            status: AuditStatus.SUCCESS,
            resourceType: RESOURCE_TYPES.NOTIFICATION,
            resourceId: String(dispatch.notificationDispatchJobId),
            afterData: {
              sốLượng: dispatch.recipientCount,
              hìnhThứcGửi: targets.targetingMethod,
              tiêuĐề: dto.title,
              loại: dto.type,
              mứcĐộ: dto.level,
              notificationDispatchJobId: dispatch.notificationDispatchJobId,
            },
          }),
        )
      }

      return BaseResponseDto.success(`Đã xếp hàng ${dispatch.recipientCount} thông báo`, {
        count: dispatch.recipientCount,
      })
    } catch (error) {
      if (adminId) await this.recordFailure(adminId, error)
      throw error
    }
  }

  private async resolveTargets(dto: SendNotificationDto, repos: UnitOfWorkRepos): Promise<NotificationTargets> {
    const optionsCount = [dto.userIds, dto.role, dto.all, dto.allUnpaidTuition].filter(Boolean).length
    if (optionsCount !== 1) {
      throw new BadRequestException(
        'Vui lòng chỉ định duy nhất một trong các lựa chọn: userIds, role, all hoặc allUnpaidTuition',
      )
    }

    let userIds: number[] = []
    let targetingMethod = ''

    if (dto.userIds?.length) {
      userIds = await repos.userRepository.filterActiveUserIds(dto.userIds)
      targetingMethod = `người dùng cụ thể (${userIds.length}/${dto.userIds.length})`
    } else if (dto.role) {
      if (!Object.values<RoleName>(ROLE_NAMES).includes(dto.role)) {
        throw new BadRequestException(`Role không hợp lệ: ${dto.role}`)
      }
      userIds = await repos.roleRepository.getUserIdsByRoleName(dto.role)
      targetingMethod = `role: ${dto.role}`
    } else if (dto.all) {
      userIds = await repos.userRepository.findAllActiveUserIds()
      targetingMethod = 'toàn bộ người dùng đang hoạt động'
    } else if (dto.allUnpaidTuition) {
      const unpaidPayments = await repos.tuitionPaymentRepository.findByStatus(TuitionPaymentStatus.UNPAID)
      const unpaidStudentIds = Array.from(new Set(unpaidPayments.map((payment) => payment.studentId)))
      const unpaidUserIds: number[] = []

      for (const studentId of unpaidStudentIds) {
        const student = await repos.studentRepository.findById(studentId)
        if (student) unpaidUserIds.push(student.userId)
      }

      userIds = await repos.userRepository.filterActiveUserIds(Array.from(new Set(unpaidUserIds)))
      targetingMethod = `học sinh chưa đóng học phí (${userIds.length})`
    }

    if (userIds.length === 0) throw new BadRequestException('Không tìm thấy người dùng để gửi thông báo')
    return { userIds, targetingMethod }
  }

  private toStringData(data?: Record<string, unknown>): Record<string, string> | undefined {
    if (!data) return undefined
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (typeof value === 'string') return [key, value]
        return [key, JSON.stringify(value) ?? String(value)]
      }),
    )
  }

  private async recordFailure(adminId: number, error: unknown): Promise<void> {
    try {
      await this.unitOfWork.executeInTransaction((repos) =>
        repos.adminAuditLogRepository.create({
          adminId,
          actionKey: ACTION_KEYS.NOTIFICATION.SEND,
          status: AuditStatus.FAIL,
          resourceType: RESOURCE_TYPES.NOTIFICATION,
          errorMessage: error instanceof Error ? error.message : 'Lỗi không xác định',
        }),
      )
    } catch {
      // Không che lỗi gửi notification gốc nếu riêng thao tác ghi audit thất bại.
    }
  }
}
