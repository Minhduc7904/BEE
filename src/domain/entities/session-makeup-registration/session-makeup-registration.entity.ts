import { ClassSession } from '../class-session/class-session.entity'

/**
 * Cặp buổi học có thể học bù cho nhau.
 * `makeupSession` (buổi B) có thể học bù cho `session` (buổi A); cặp luôn được lưu cả hai chiều.
 */
export class SessionMakeupRegistration {
  sessionMakeupRegistrationId: number
  /** Buổi được bù (buổi mà học sinh có thể vắng). */
  sessionId: number
  /** Buổi học bù được cho `sessionId`. */
  makeupSessionId: number
  createdAt: Date

  // Navigation properties
  session?: ClassSession
  makeupSession?: ClassSession

  constructor(data: {
    sessionMakeupRegistrationId: number
    sessionId: number
    makeupSessionId: number
    createdAt?: Date
    session?: ClassSession
    makeupSession?: ClassSession
  }) {
    this.sessionMakeupRegistrationId = data.sessionMakeupRegistrationId
    this.sessionId = data.sessionId
    this.makeupSessionId = data.makeupSessionId
    this.createdAt = data.createdAt ?? new Date()
    this.session = data.session
    this.makeupSession = data.makeupSession
  }
}
