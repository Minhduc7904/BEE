import { Prisma } from '@prisma/client'
import type { ISessionMakeupRegistrationRepository } from '../../../domain/repositories/session-makeup-registration.repository'
import type { SessionMakeupPair } from '../../../domain/interface/session-makeup-registration/session-makeup-registration.interface'
import type { SessionMakeupRegistration } from '../../../domain/entities/session-makeup-registration/session-makeup-registration.entity'
import { SessionMakeupRegistrationMapper } from '../../mappers/class/session-makeup-registration.mapper'

/**
 * `PrismaService` kế thừa `PrismaClient` nên cũng thỏa `Prisma.TransactionClient`.
 */
type SessionMakeupPrismaClient = Prisma.TransactionClient

const SESSION_WITH_CLASS = { include: { courseClass: true } } as const

export class PrismaSessionMakeupRegistrationRepository implements ISessionMakeupRegistrationRepository {
  constructor(private readonly prisma: SessionMakeupPrismaClient) {}

  async findBySessionIds(sessionIds: number[]): Promise<SessionMakeupRegistration[]> {
    if (sessionIds.length === 0) return []

    const records = await this.prisma.sessionMakeupRegistration.findMany({
      where: { sessionId: { in: sessionIds } },
      include: { makeupSession: SESSION_WITH_CLASS },
      orderBy: [{ sessionId: 'asc' }, { makeupSessionId: 'asc' }],
    })

    return SessionMakeupRegistrationMapper.toDomainSessionMakeupRegistrations(records)
  }

  async findByMakeupSessionIds(sessionIds: number[]): Promise<SessionMakeupRegistration[]> {
    if (sessionIds.length === 0) return []

    const records = await this.prisma.sessionMakeupRegistration.findMany({
      where: { makeupSessionId: { in: sessionIds } },
      orderBy: [{ makeupSessionId: 'asc' }, { sessionId: 'asc' }],
    })

    return SessionMakeupRegistrationMapper.toDomainSessionMakeupRegistrations(records)
  }

  async deleteTouchingSessionIds(sessionIds: number[]): Promise<void> {
    if (sessionIds.length === 0) return

    await this.prisma.sessionMakeupRegistration.deleteMany({
      where: { OR: [{ sessionId: { in: sessionIds } }, { makeupSessionId: { in: sessionIds } }] },
    })
  }

  async createMany(pairs: SessionMakeupPair[]): Promise<void> {
    if (pairs.length === 0) return

    await this.prisma.sessionMakeupRegistration.createMany({
      data: pairs.map((pair) => ({ sessionId: pair.sessionId, makeupSessionId: pair.makeupSessionId })),
      skipDuplicates: true,
    })
  }
}
