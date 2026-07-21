import { Prisma } from '@prisma/client'

import { BackgroundJobLock } from '../../../domain/entities/background-job'
import type {
  AcquireBackgroundJobLockData,
  IBackgroundJobLockRepository,
} from '../../../domain/repositories/background-job-lock.repository'
import type { BackgroundJobLockListOptions } from '../../../domain/interface/background-job'
import { PrismaService } from '../../../prisma/prisma.service'
import { BackgroundJobLockMapper } from '../../mappers/background-job'

export class PrismaBackgroundJobLockRepository implements IBackgroundJobLockRepository {
  constructor(private readonly prisma: PrismaService | Prisma.TransactionClient) {}

  async findByBackgroundJobId(backgroundJobId: number): Promise<BackgroundJobLock | null> {
    const lock = await this.prisma.backgroundJobLock.findUnique({ where: { backgroundJobId } })
    return BackgroundJobLockMapper.toDomain(lock)
  }

  async findAll(options: BackgroundJobLockListOptions): Promise<{ data: BackgroundJobLock[]; total: number }> {
    const now = new Date()
    const where: Prisma.BackgroundJobLockWhereInput = {
      ...(options.backgroundJobId !== undefined && { backgroundJobId: options.backgroundJobId }),
      ...(options.isActive === true && { leaseExpiresAt: { gt: now } }),
      ...(options.isActive === false && { leaseExpiresAt: { lte: now } }),
      ...(options.search && { workerId: { contains: options.search } }),
    }
    const [locks, total] = await Promise.all([
      this.prisma.backgroundJobLock.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { [options.sortBy ?? 'leaseExpiresAt']: options.sortOrder ?? 'desc' },
      }),
      this.prisma.backgroundJobLock.count({ where }),
    ])
    return { data: locks.map((lock) => BackgroundJobLockMapper.toDomain(lock)!), total }
  }

  async tryAcquire(data: AcquireBackgroundJobLockData): Promise<BackgroundJobLock | null> {
    const renewed = await this.prisma.backgroundJobLock.updateMany({
      where: {
        backgroundJobId: data.backgroundJobId,
        leaseExpiresAt: { lte: data.lockedAt },
      },
      data: {
        lockToken: data.lockToken,
        workerId: data.workerId,
        lockedAt: data.lockedAt,
        leaseExpiresAt: data.leaseExpiresAt,
      },
    })

    if (renewed.count > 0) {
      return this.findByBackgroundJobId(data.backgroundJobId)
    }

    try {
      const created = await this.prisma.backgroundJobLock.create({ data })
      return BackgroundJobLockMapper.toDomain(created)
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        return null
      }
      throw error
    }
  }

  async release(backgroundJobId: number, lockToken: string): Promise<void> {
    await this.prisma.backgroundJobLock.deleteMany({
      where: { backgroundJobId, lockToken },
    })
  }

  private isUniqueConstraint(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }
}
