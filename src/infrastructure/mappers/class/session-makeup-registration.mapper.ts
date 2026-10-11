import { SessionMakeupRegistration } from '../../../domain/entities/session-makeup-registration/session-makeup-registration.entity'
import { ClassSessionMapper } from './class-session.mapper'

/**
 * Chuyển bản ghi Prisma `SessionMakeupRegistration` (kèm quan hệ đã được repository include) sang Domain Entity.
 */
export class SessionMakeupRegistrationMapper {
  static toDomainSessionMakeupRegistration(record: any): SessionMakeupRegistration {
    return new SessionMakeupRegistration({
      sessionMakeupRegistrationId: record.sessionMakeupRegistrationId,
      sessionId: record.sessionId,
      makeupSessionId: record.makeupSessionId,
      createdAt: record.createdAt,
      session: record.session ? ClassSessionMapper.toDomainClassSession(record.session) : undefined,
      makeupSession: record.makeupSession ? ClassSessionMapper.toDomainClassSession(record.makeupSession) : undefined,
    })
  }

  static toDomainSessionMakeupRegistrations(records: any[]): SessionMakeupRegistration[] {
    return records.map((record) => this.toDomainSessionMakeupRegistration(record))
  }
}
