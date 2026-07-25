import { Prisma } from '@prisma/client'

import { ActionApprovalRequest } from '../../../domain/entities/action-approval-request'
import type {
  CreateActionApprovalRequestData,
  ResolveActionApprovalRequestData,
} from '../../../domain/interface/action-approval-request'
import type { IActionApprovalRequestRepository } from '../../../domain/repositories/action-approval-request.repository'
import { PrismaService } from '../../../prisma/prisma.service'
import { ActionApprovalRequestStatus } from '../../../shared/enums'
import { ActionApprovalRequestMapper } from '../../mappers/action-approval-request'

export class PrismaActionApprovalRequestRepository implements IActionApprovalRequestRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async create(data: CreateActionApprovalRequestData): Promise<ActionApprovalRequest> {
    const record = await this.prisma.actionApprovalRequest.create({
      data: {
        type: data.type,
        requesterUserId: data.requesterUserId,
        recipientUserId: data.recipientUserId,
        payload: data.payload as Prisma.InputJsonValue,
        activeDedupKey: data.activeDedupKey,
        dedupKey: data.dedupKey,
        actionTokenHash: data.actionTokenHash,
        expiresAt: data.expiresAt,
      },
    })

    return ActionApprovalRequestMapper.toDomain(record)!
  }

  async findById(id: number): Promise<ActionApprovalRequest | null> {
    const record = await this.prisma.actionApprovalRequest.findUnique({
      where: { actionApprovalRequestId: id },
    })

    return ActionApprovalRequestMapper.toDomain(record)
  }

  async findByActionTokenHash(tokenHash: string): Promise<ActionApprovalRequest | null> {
    const record = await this.prisma.actionApprovalRequest.findUnique({
      where: { actionTokenHash: tokenHash },
    })

    return ActionApprovalRequestMapper.toDomain(record)
  }

  async findByActiveDedupKey(activeDedupKey: string): Promise<ActionApprovalRequest | null> {
    const record = await this.prisma.actionApprovalRequest.findUnique({
      where: { activeDedupKey },
    })

    return ActionApprovalRequestMapper.toDomain(record)
  }

  async findLatestByDedupKey(dedupKey: string): Promise<ActionApprovalRequest | null> {
    const record = await this.prisma.actionApprovalRequest.findFirst({
      where: { dedupKey },
      orderBy: [{ createdAt: 'desc' }, { actionApprovalRequestId: 'desc' }],
    })

    return ActionApprovalRequestMapper.toDomain(record)
  }

  async countCreatedByRequesterSince(requesterUserId: number, since: Date): Promise<number> {
    return this.prisma.actionApprovalRequest.count({
      where: {
        requesterUserId,
        createdAt: { gte: since },
      },
    })
  }

  async countCreatedByRecipientSince(recipientUserId: number, since: Date): Promise<number> {
    return this.prisma.actionApprovalRequest.count({
      where: {
        recipientUserId,
        createdAt: { gte: since },
      },
    })
  }

  async claimPending(id: number, now: Date): Promise<boolean> {
    const result = await this.prisma.actionApprovalRequest.updateMany({
      where: {
        actionApprovalRequestId: id,
        status: ActionApprovalRequestStatus.PENDING,
        expiresAt: { gt: now },
      },
      data: { status: ActionApprovalRequestStatus.PROCESSING },
    })

    return result.count === 1
  }

  async resolveProcessing(id: number, data: ResolveActionApprovalRequestData): Promise<void> {
    await this.prisma.actionApprovalRequest.update({
      where: { actionApprovalRequestId: id },
      data: {
        status: data.status,
        activeDedupKey: null,
        respondedAt: data.respondedAt,
        cooldownUntil: data.cooldownUntil ?? null,
      },
    })
  }

  async expirePending(id: number, now: Date, cooldownUntil: Date): Promise<boolean> {
    const result = await this.prisma.actionApprovalRequest.updateMany({
      where: {
        actionApprovalRequestId: id,
        status: ActionApprovalRequestStatus.PENDING,
        expiresAt: { lte: now },
      },
      data: {
        status: ActionApprovalRequestStatus.EXPIRED,
        activeDedupKey: null,
        respondedAt: now,
        cooldownUntil,
      },
    })

    return result.count === 1
  }

  async cancelPending(id: number, respondedAt: Date): Promise<boolean> {
    const result = await this.prisma.actionApprovalRequest.updateMany({
      where: {
        actionApprovalRequestId: id,
        status: ActionApprovalRequestStatus.PENDING,
      },
      data: {
        status: ActionApprovalRequestStatus.CANCELED,
        activeDedupKey: null,
        respondedAt,
      },
    })

    return result.count === 1
  }

  async markEmailSent(id: number, sentAt: Date): Promise<void> {
    await this.prisma.actionApprovalRequest.update({
      where: { actionApprovalRequestId: id },
      data: { emailSentAt: sentAt },
    })
  }
}
