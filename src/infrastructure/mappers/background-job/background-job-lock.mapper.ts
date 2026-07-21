import type { BackgroundJobLock as PrismaBackgroundJobLock } from '@prisma/client'

import { BackgroundJobLock } from '../../../domain/entities/background-job'

export class BackgroundJobLockMapper {
  static toDomain(prismaLock: PrismaBackgroundJobLock | null | undefined): BackgroundJobLock | null {
    if (!prismaLock) return null

    return new BackgroundJobLock({
      backgroundJobId: prismaLock.backgroundJobId,
      lockToken: prismaLock.lockToken,
      workerId: prismaLock.workerId,
      lockedAt: prismaLock.lockedAt,
      leaseExpiresAt: prismaLock.leaseExpiresAt,
      createdAt: prismaLock.createdAt,
      updatedAt: prismaLock.updatedAt,
    })
  }
}
