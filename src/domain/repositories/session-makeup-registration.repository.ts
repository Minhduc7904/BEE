import type { SessionMakeupRegistration } from '../entities/session-makeup-registration/session-makeup-registration.entity'
import type { SessionMakeupPair } from '../interface/session-makeup-registration/session-makeup-registration.interface'

/**
 * Cặp buổi học có thể học bù cho nhau; dữ liệu được đồng bộ tự động khi buổi học hoặc nhóm học bù thay đổi.
 */
export interface ISessionMakeupRegistrationRepository {
  /**
   * Các dòng có `sessionId` thuộc tập (những buổi học bù được cho các buổi này), kèm `makeupSession` và lớp của buổi đó.
   */
  findBySessionIds(sessionIds: number[]): Promise<SessionMakeupRegistration[]>

  /**
   * Các dòng có `makeupSessionId` thuộc tập (những buổi mà các buổi này bù được).
   */
  findByMakeupSessionIds(sessionIds: number[]): Promise<SessionMakeupRegistration[]>

  /**
   * Xóa mọi dòng có `sessionId` hoặc `makeupSessionId` thuộc tập.
   */
  deleteTouchingSessionIds(sessionIds: number[]): Promise<void>

  /**
   * Thêm các cặp, bỏ qua cặp đã tồn tại.
   */
  createMany(pairs: SessionMakeupPair[]): Promise<void>
}
