import { Injectable } from '@nestjs/common'
import type { Attendance } from 'src/domain/entities/attendance/attendance.entity'
import type { UnitOfWorkRepos } from 'src/domain/repositories'
import { AttendanceStatus, AttendanceType } from 'src/shared/enums'

interface AttendanceKind {
  status: AttendanceStatus
  attendanceType: AttendanceType
}

export interface AttendanceMakeupReconcileResult {
  /** Số buổi vắng vừa được nối vào bản ghi (khi bản ghi trở thành Có mặt/Muộn + Học bù). */
  linkedAbsenceCount: number
  /** Số buổi vắng vừa bị gỡ khỏi bản ghi (khi bản ghi không còn đủ điều kiện học bù). */
  releasedAbsenceCount: number
}

/**
 * `MAKEUP` chỉ hợp lệ khi trạng thái cuối cùng là Có mặt hoặc Muộn.
 * Bản ghi Vắng luôn là `REGULAR`, kể cả khi request gửi `MAKEUP`.
 */
export function normalizeAttendanceType(
  status: AttendanceStatus,
  attendanceType: AttendanceType | undefined | null,
): AttendanceType {
  if (status === AttendanceStatus.ABSENT) return AttendanceType.REGULAR

  return attendanceType ?? AttendanceType.REGULAR
}

/** Bản ghi có thể đứng tên "đã học bù" cho các buổi vắng: Có mặt/Muộn và loại Học bù. */
export function isMakeupTarget(attendance: AttendanceKind): boolean {
  return (
    (attendance.status === AttendanceStatus.PRESENT || attendance.status === AttendanceStatus.LATE) &&
    attendance.attendanceType === AttendanceType.MAKEUP
  )
}

/**
 * Nối / gỡ liên kết học bù giữa bản ghi Vắng và bản ghi Có mặt/Muộn + Học bù của cùng một học sinh.
 *
 * - Bản ghi Vắng giữ `makeupByAttendanceId` trỏ tới bản ghi học bù cho nó.
 * - Một bản ghi học bù có thể bù cho nhiều buổi vắng. Loại điểm danh do người dùng chọn;
 *   service này không bao giờ tự nâng `REGULAR` thành `MAKEUP`.
 * - Cặp buổi hợp lệ đọc từ `session_makeup_registrations`.
 *
 * Mọi hàm nhận `repos` để chạy trong transaction của use case gọi nó.
 */
@Injectable()
export class AttendanceMakeupLinkService {
  /**
   * Đồng bộ liên kết sau khi bản ghi đã được lưu với trạng thái/loại đã chuẩn hóa.
   *
   * @param previous trạng thái/loại trước thay đổi; `null` khi bản ghi vừa được tạo
   */
  async reconcile(
    repos: UnitOfWorkRepos,
    attendance: Attendance,
    previous: AttendanceKind | null,
  ): Promise<AttendanceMakeupReconcileResult> {
    const result: AttendanceMakeupReconcileResult = { linkedAbsenceCount: 0, releasedAbsenceCount: 0 }
    const eligible = isMakeupTarget(attendance)

    // Chỉ bản ghi Vắng mới có thể "đã được bù"
    if (attendance.status !== AttendanceStatus.ABSENT && attendance.makeupByAttendanceId != null) {
      await this.clearOwnMakeupLink(repos, attendance.attendanceId)
      attendance.makeupByAttendanceId = null
    }

    if (previous !== null && !eligible) {
      result.releasedAbsenceCount = await this.releaseMadeUpAbsences(repos, attendance.attendanceId)
    }

    if (eligible) {
      // Chuyển Có mặt ↔ Muộn khi vẫn là Học bù giữ nguyên các liên kết
      if (previous === null || !isMakeupTarget(previous)) {
        result.linkedAbsenceCount = await this.linkAbsencesTo(repos, attendance)
      }
    } else if (attendance.status === AttendanceStatus.ABSENT) {
      await this.linkAbsenceToMakeup(repos, attendance)
    }

    return result
  }

  /**
   * Nối mọi bản ghi Vắng chưa được bù của cùng học sinh, ở các buổi mà buổi hiện tại học bù được,
   * vào bản ghi Có mặt/Muộn + Học bù này.
   *
   * @returns số buổi vắng đã được nối
   */
  async linkAbsencesTo(repos: UnitOfWorkRepos, makeupAttendance: Attendance): Promise<number> {
    if (!isMakeupTarget(makeupAttendance)) return 0

    const registrations = await repos.sessionMakeupRegistrationRepository.findByMakeupSessionIds([
      makeupAttendance.sessionId,
    ])
    const absentSessionIds = registrations.map((registration) => registration.sessionId)

    if (absentSessionIds.length === 0) return 0

    const candidates = await repos.attendanceRepository.findByStudentAndSessionIds(
      makeupAttendance.studentId,
      absentSessionIds,
    )
    const absences = candidates.filter(
      (candidate) =>
        candidate.status === AttendanceStatus.ABSENT &&
        (candidate.makeupByAttendanceId === null || candidate.makeupByAttendanceId === undefined),
    )

    if (absences.length === 0) return 0

    await repos.attendanceRepository.setMakeupByAttendanceId(
      absences.map((absence) => absence.attendanceId),
      makeupAttendance.attendanceId,
    )

    return absences.length
  }

  /**
   * Nối một bản ghi Vắng chưa được bù vào bản ghi Có mặt/Muộn + Học bù hợp lệ của cùng học sinh,
   * ở các buổi học bù được cho buổi vắng. Ưu tiên sessionDate, startTime, rồi attendanceId tăng dần.
   *
   * @param excludeAttendanceId bản ghi không được chọn (bản ghi vừa mất tư cách học bù)
   * @returns `true` nếu đã nối được
   */
  async linkAbsenceToMakeup(
    repos: UnitOfWorkRepos,
    absentAttendance: Attendance,
    excludeAttendanceId?: number,
  ): Promise<boolean> {
    if (absentAttendance.status !== AttendanceStatus.ABSENT) return false

    if (absentAttendance.makeupByAttendanceId !== null && absentAttendance.makeupByAttendanceId !== undefined) {
      return false
    }

    const registrations = await repos.sessionMakeupRegistrationRepository.findBySessionIds([absentAttendance.sessionId])
    const makeupSessionIds = registrations.map((registration) => registration.makeupSessionId)

    if (makeupSessionIds.length === 0) return false

    const candidates = (
      await repos.attendanceRepository.findByStudentAndSessionIds(absentAttendance.studentId, makeupSessionIds)
    ).filter((candidate) => isMakeupTarget(candidate) && candidate.attendanceId !== excludeAttendanceId)

    if (candidates.length === 0) return false

    const chosen = [...candidates].sort(compareMakeupCandidates)[0]

    await repos.attendanceRepository.setMakeupByAttendanceId([absentAttendance.attendanceId], chosen.attendanceId)
    absentAttendance.makeupByAttendanceId = chosen.attendanceId

    return true
  }

  /**
   * Gỡ liên kết của mọi bản ghi Vắng đang trỏ tới `attendanceId`, rồi thử nối từng bản ghi vắng đó sang
   * một bản ghi học bù khác (không nối lại về chính `attendanceId`).
   *
   * @returns số buổi vắng đã được gỡ
   */
  async releaseMadeUpAbsences(repos: UnitOfWorkRepos, attendanceId: number): Promise<number> {
    const absences = await repos.attendanceRepository.findByMakeupByAttendanceId(attendanceId)

    if (absences.length === 0) return 0

    await repos.attendanceRepository.setMakeupByAttendanceId(
      absences.map((absence) => absence.attendanceId),
      null,
    )

    for (const absence of absences) {
      absence.makeupByAttendanceId = null
      await this.linkAbsenceToMakeup(repos, absence, attendanceId)
    }

    return absences.length
  }

  /** Nối lại các bản ghi Vắng vừa mất liên kết (vd. do bản ghi học bù bị xóa) sang candidate khác. */
  async relinkAbsences(repos: UnitOfWorkRepos, absences: Attendance[], excludeAttendanceId: number): Promise<void> {
    for (const absence of absences) {
      absence.makeupByAttendanceId = null
      await this.linkAbsenceToMakeup(repos, absence, excludeAttendanceId)
    }
  }

  /** Xóa liên kết của chính bản ghi (không còn là buổi vắng nên không còn "đã được bù"). */
  async clearOwnMakeupLink(repos: UnitOfWorkRepos, attendanceId: number): Promise<void> {
    await repos.attendanceRepository.setMakeupByAttendanceId([attendanceId], null)
  }
}

function sessionSortKey(attendance: Attendance): [number, string] {
  const session = attendance.classSession

  return [session ? session.sessionDate.getTime() : 0, session ? session.startTime.toISOString().slice(11, 19) : '']
}

/** Sớm nhất theo sessionDate, startTime, rồi attendanceId tăng dần. */
function compareMakeupCandidates(left: Attendance, right: Attendance): number {
  const [leftDate, leftTime] = sessionSortKey(left)
  const [rightDate, rightTime] = sessionSortKey(right)

  return leftDate - rightDate || leftTime.localeCompare(rightTime) || left.attendanceId - right.attendanceId
}
