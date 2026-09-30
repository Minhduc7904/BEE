import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import { createHash, randomUUID } from 'crypto'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { ROLE_NAMES, type RoleName } from '../../../shared/constants/roles.constant'
import {
  AuditStatus,
  NotificationAudienceType,
  NotificationDeliveryChannel,
  NotificationLevel,
  NotificationRecipientType,
  NotificationType,
  TuitionPaymentStatus,
} from '../../../shared/enums'
import { BaseResponseDto } from '../../dtos/common/base-response.dto'
import { SendNotificationDto } from '../../dtos/notification/send-notification.dto'
import {
  EnqueueNotificationDispatchJobUseCase,
  type EnqueueNotificationDispatchJobResult,
} from './enqueue-notification-dispatch-job.use-case'

interface NotificationTargets {
  userIds: number[]
  targetingMethod: string
  audienceType: NotificationAudienceType
  audienceRecipientType?: NotificationRecipientType
}

export interface SendNotificationResult {
  jobId: number
  status: string
  recipientCount: number
  totalDeliveryCount: number
  reused: boolean
  sentDeliveryCount: number
  skippedDeliveryCount: number
  deadDeliveryCount: number
}

@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    private readonly enqueueNotificationDispatchJob: EnqueueNotificationDispatchJobUseCase,
  ) {}

  async execute(
    dto: SendNotificationDto,
    adminId?: number,
    requestedKey?: string,
  ): Promise<BaseResponseDto<SendNotificationResult>> {
    const idempotencyKey = requestedKey?.trim() || `legacy:${adminId ?? 'system'}:${randomUUID()}`
    const channels = dto.channels?.length
      ? Array.from(new Set(dto.channels))
      : [NotificationDeliveryChannel.IN_APP, NotificationDeliveryChannel.PUSH]
    if (channels.includes(NotificationDeliveryChannel.ZALO_OA)) {
      throw new BadRequestException('Admin không được gửi trực tiếp qua kênh ZALO_OA')
    }
    const requestFingerprint = this.fingerprint(dto, channels)

    let dispatch: EnqueueNotificationDispatchJobResult
    try {
      dispatch = await this.unitOfWork.executeInTransaction(async (repos) => {
        const targets = await this.resolveTargets(dto, repos)
        const queued = await this.enqueueNotificationDispatchJob.executeWithRepos(repos, {
          idempotencyKey,
          requestFingerprint,
          userIds: targets.userIds,
          channels,
          title: dto.title,
          message: dto.message,
          type: dto.type ?? NotificationType.SYSTEM,
          level: dto.level ?? NotificationLevel.INFO,
          data: this.toStringData(dto.data),
          createdByAdminId: adminId,
          audienceType: targets.audienceType,
          audienceRecipientType: targets.audienceRecipientType,
          sourceType: 'ADMIN',
          sourceId: adminId ? String(adminId) : undefined,
          sourceEvent: 'MANUAL_SEND',
        })

        if (adminId && !queued.reused) {
          await repos.adminAuditLogRepository.create({
            adminId,
            actionKey: ACTION_KEYS.NOTIFICATION.SEND,
            status: AuditStatus.SUCCESS,
            resourceType: RESOURCE_TYPES.NOTIFICATION,
            resourceId: String(queued.notificationDispatchJobId),
            afterData: {
              sốLượng: queued.recipientCount,
              hìnhThứcGửi: targets.targetingMethod,
              tiêuĐề: dto.title,
              loại: dto.type,
              mứcĐộ: dto.level,
              channels,
              notificationDispatchJobId: queued.notificationDispatchJobId,
            },
          })
        }
        return queued
      })
    } catch (error) {
      if (!this.isUniqueConflict(error)) throw error
      const existing = await this.unitOfWork.executeInTransaction((repos) =>
        repos.notificationDispatchJobRepository.findByIdempotencyKey(idempotencyKey),
      )
      if (!existing) throw error
      if (existing.requestFingerprint && existing.requestFingerprint !== requestFingerprint) {
        throw new ConflictException('Idempotency-Key đã được sử dụng với nội dung khác')
      }
      dispatch = {
        notificationDispatchJobId: existing.notificationDispatchJobId,
        status: existing.status,
        recipientCount: existing.recipientCount,
        deliveryCount: existing.totalDeliveryCount,
        reused: true,
        sentDeliveryCount: existing.sentDeliveryCount,
        skippedDeliveryCount: existing.skippedDeliveryCount,
        deadDeliveryCount: existing.deadDeliveryCount,
      }
    }

    return BaseResponseDto.success(dispatch.reused ? 'Yêu cầu đã được xếp hàng trước đó' : 'Đã xếp hàng thông báo', {
      jobId: dispatch.notificationDispatchJobId,
      status: dispatch.status,
      recipientCount: dispatch.recipientCount,
      totalDeliveryCount: dispatch.deliveryCount,
      reused: dispatch.reused,
      sentDeliveryCount: dispatch.sentDeliveryCount,
      skippedDeliveryCount: dispatch.skippedDeliveryCount,
      deadDeliveryCount: dispatch.deadDeliveryCount,
    })
  }

  private async resolveTargets(dto: SendNotificationDto, repos: UnitOfWorkRepos): Promise<NotificationTargets> {
    const optionsCount = [dto.userIds?.length, dto.role, dto.all, dto.allUnpaidTuition].filter(Boolean).length
    if (optionsCount !== 1) throw new BadRequestException('Vui lòng chỉ định duy nhất một nhóm người nhận')

    if (dto.userIds?.length) {
      const userIds = await repos.userRepository.filterActiveUserIds(dto.userIds)
      if (!userIds.length) throw new BadRequestException('Không tìm thấy người dùng để gửi thông báo')
      return {
        userIds,
        targetingMethod: `người dùng cụ thể (${userIds.length}/${dto.userIds.length})`,
        audienceType: NotificationAudienceType.SPECIFIC_USERS,
        audienceRecipientType: dto.recipientType,
      }
    }
    if (dto.role) {
      if (!Object.values<RoleName>(ROLE_NAMES).includes(dto.role))
        throw new BadRequestException(`Role không hợp lệ: ${dto.role}`)
      const userIds = await repos.roleRepository.getUserIdsByRoleName(dto.role)
      if (!userIds.length) throw new BadRequestException('Không tìm thấy người dùng để gửi thông báo')
      return {
        userIds,
        targetingMethod: `role: ${dto.role}`,
        audienceType: NotificationAudienceType.ROLE,
        audienceRecipientType: this.roleToRecipientType(dto.role),
      }
    }
    if (dto.all) {
      const userIds = await repos.userRepository.findAllActiveUserIds()
      if (!userIds.length) throw new BadRequestException('Không tìm thấy người dùng để gửi thông báo')
      return {
        userIds,
        targetingMethod: 'toàn bộ người dùng đang hoạt động',
        audienceType: NotificationAudienceType.ALL_USERS,
      }
    }

    const unpaidPayments = await repos.tuitionPaymentRepository.findByStatus(TuitionPaymentStatus.UNPAID)
    const unpaidUserIds: number[] = []
    for (const studentId of Array.from(new Set(unpaidPayments.map((payment) => payment.studentId)))) {
      const student = await repos.studentRepository.findById(studentId)
      if (student) unpaidUserIds.push(student.userId)
    }
    const userIds = await repos.userRepository.filterActiveUserIds(Array.from(new Set(unpaidUserIds)))
    if (!userIds.length) throw new BadRequestException('Không tìm thấy học sinh chưa đóng học phí')
    return {
      userIds,
      targetingMethod: `học sinh chưa đóng học phí (${userIds.length})`,
      audienceType: NotificationAudienceType.UNPAID_TUITION_STUDENTS,
      audienceRecipientType: NotificationRecipientType.STUDENT,
    }
  }

  private fingerprint(dto: SendNotificationDto, channels: NotificationDeliveryChannel[]): string {
    const normalized = {
      title: dto.title.trim(),
      message: dto.message.trim(),
      type: dto.type ?? NotificationType.SYSTEM,
      level: dto.level ?? NotificationLevel.INFO,
      data: dto.data ?? null,
      userIds: dto.userIds ? Array.from(new Set(dto.userIds)).sort((a, b) => a - b) : null,
      role: dto.role ?? null,
      all: !!dto.all,
      allUnpaidTuition: !!dto.allUnpaidTuition,
      recipientType: dto.recipientType ?? null,
      channels: [...channels].sort(),
    }
    return createHash('sha256')
      .update(JSON.stringify(this.canonicalize(normalized)))
      .digest('hex')
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.canonicalize(item))
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, item]) => [key, this.canonicalize(item)]),
      )
    }
    return value
  }

  private roleToRecipientType(role: string): NotificationRecipientType | undefined {
    if (role === ROLE_NAMES.STUDENT) return NotificationRecipientType.STUDENT
    if (role === ROLE_NAMES.ADMIN) return NotificationRecipientType.ADMIN
    return undefined
  }

  private toStringData(data?: Record<string, unknown>): Record<string, string> | undefined {
    if (!data) return undefined
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : (JSON.stringify(value) ?? String(value)),
      ]),
    )
  }

  private isUniqueConflict(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
  }
}
