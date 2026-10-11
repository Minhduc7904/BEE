import { Injectable } from '@nestjs/common'
import type { Attendance } from 'src/domain/entities/attendance/attendance.entity'
import type { UnitOfWorkRepos } from 'src/domain/repositories'
import { AttendanceStatus, AttendanceType } from 'src/shared/enums'

/**
 * Nối / gỡ liên kết học bù giữa bản ghi Vắng và bản ghi Có mặt của cùng một học sinh.
 *
 * - Bản ghi Vắng giữ `makeupByAttendanceId` trỏ tới bản ghi Có mặt đã học bù cho nó.
 * - Một bản ghi Có mặt có thể bù cho nhiều buổi vắng; khi nối được ít nhất một buổi vắng nó trở thành `MAKEUP`.
 * - Cặp buổi hợp lệ đọc từ `session_makeup_registrations`. Trạng thái Muộn không tham gia liên kết.
 *
 * Mọi hàm nhận `repos` để chạy trong transaction của use case gọi nó.
 */
@Injectable()
export class AttendanceMakeupLinkService {
  /**
   * Điểm danh có mặt: gán `makeupByAttendanceId` của mọi bản ghi Vắng chưa được bù của cùng học sinh,
   * ở các buổi mà buổi hiện tại học bù được, rồi đổi bản ghi hiện tại sang `MAKEUP` nếu nối được.
   * Cập nhật trực tiếp `presentAttendance.attendanceType` để response phản ánh loại mới.
   *
   * @returns số buổi vắng đã được nối
   */
  async linkAbsencesTo(repos: UnitOfWorkRepos, presentAttendance: Attendance): Promise<number> {
    if (presentAttendance.status !== AttendanceStatus.PRESENT) return 0

    const registrations = await repos.sessionMakeupRegistrationRepository.findByMakeupSessionIds([
      presentAttendance.sessionId,
    ])
    const absentSessionIds = registrations.map((registration) => registration.sessionId)

    if (absentSessionIds.length === 0) return 0

    const candidates = await repos.attendanceRepository.findByStudentAndSessionIds(
      presentAttendance.studentId,
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
      presentAttendance.attendanceId,
    )

    if (presentAttendance.attendanceType !== AttendanceType.MAKEUP) {
      await repos.attendanceRepository.update(presentAttendance.attendanceId, {
        attendanceType: AttendanceType.MAKEUP,
      })
      presentAttendance.attendanceType = AttendanceType.MAKEUP
    }

    return absences.length
  }

  /**
   * Bản ghi Vắng xuất hiện: tìm bản ghi Có mặt của cùng học sinh ở các buổi học bù được cho buổi này,
   * ưu tiên bản ghi đã là `MAKEUP`, sau đó sớm nhất (sessionDate, startTime, attendanceId).
   * Gán `makeupByAttendanceId` cho bản ghi vắng và đổi bản ghi được chọn sang `MAKEUP` nếu chưa phải.
   *
   * @param excludeAttendanceId bản ghi không được chọn (bản ghi vừa gỡ liên kết khỏi buổi vắng này)
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
    ).filter(
      (candidate) => candidate.status === AttendanceStatus.PRESENT && candidate.attendanceId !== excludeAttendanceId,
    )

    if (candidates.length === 0) return false

    const chosen = [...candidates].sort(compareMakeupCandidates)[0]

    await repos.attendanceRepository.setMakeupByAttendanceId([absentAttendance.attendanceId], chosen.attendanceId)
    absentAttendance.makeupByAttendanceId = chosen.attendanceId

    if (chosen.attendanceType !== AttendanceType.MAKEUP) {
      await repos.attendanceRepository.update(chosen.attendanceId, { attendanceType: AttendanceType.MAKEUP })
    }

    return true
  }

  /**
   * Gỡ liên kết của mọi bản ghi Vắng đang trỏ tới `attendanceId`, rồi thử nối từng bản ghi vắng đó sang
   * một bản ghi Có mặt khác (không nối lại về chính `attendanceId`).
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

  /**
   * Xóa liên kết của chính bản ghi (khi bản ghi Vắng được điểm danh tiếp thì không còn "đã được bù").
   * Bản ghi đã bù cho nó giữ nguyên `MAKEUP`.
   */
  async clearOwnMakeupLink(repos: UnitOfWorkRepos, attendanceId: number): Promise<void> {
    await repos.attendanceRepository.setMakeupByAttendanceId([attendanceId], null)
  }
}

function sessionSortKey(attendance: Attendance): [number, string] {
  const session = attendance.classSession

  return [session ? session.sessionDate.getTime() : 0, session ? session.startTime.toISOString().slice(11, 19) : '']
}

/**
 * Ưu tiên bản ghi đã là MAKEUP, sau đó sớm nhất theo sessionDate, startTime, attendanceId.
 */
function compareMakeupCandidates(left: Attendance, right: Attendance): number {
  const leftMakeup = left.attendanceType === AttendanceType.MAKEUP ? 0 : 1
  const rightMakeup = right.attendanceType === AttendanceType.MAKEUP ? 0 : 1

  if (leftMakeup !== rightMakeup) return leftMakeup - rightMakeup

  const [leftDate, leftTime] = sessionSortKey(left)
  const [rightDate, rightTime] = sessionSortKey(right)

  return leftDate - rightDate || leftTime.localeCompare(rightTime) || left.attendanceId - right.attendanceId
}
