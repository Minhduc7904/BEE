/* eslint-disable @typescript-eslint/require-await -- in-memory fakes mimic async repository signatures */
import { Attendance } from '../../domain/entities/attendance/attendance.entity'
import { ClassSession } from '../../domain/entities/class-session/class-session.entity'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../domain/repositories'
import type { CreateAttendanceData, UpdateAttendanceData } from '../../domain/interface/attendance/attendance.interface'
import { AttendanceStatus, AttendanceType } from '../../shared/enums'
import { AttendanceMakeupLinkService } from './attendance-makeup-link.service'

/**
 * Fixture dùng chung cho các spec liên kết học bù: lưu trữ trong bộ nhớ, mỗi lần đọc trả bản sao mới
 * (giống DB thật) để việc sửa object trong service không "rò" vào dữ liệu đã lưu.
 */

interface SessionRecord {
  sessionId: number
  classId: number
  name: string
  sessionDate: Date
  startTime: Date
}

interface AttendanceRecord {
  attendanceId: number
  sessionId: number
  studentId: number
  status: AttendanceStatus
  attendanceType: AttendanceType
  markedAt: Date
  markerId: number | null
  makeupByAttendanceId: number | null
}

export const STUDENT_ID = 100

export function createMakeupWorld() {
  const sessions = new Map<number, SessionRecord>()
  const pairs: Array<{ sessionId: number; makeupSessionId: number }> = []
  const records = new Map<number, AttendanceRecord>()
  let nextAttendanceId = 1

  const toSession = (record: SessionRecord) =>
    new ClassSession({
      sessionId: record.sessionId,
      classId: record.classId,
      name: record.name,
      sessionDate: record.sessionDate,
      startTime: record.startTime,
      endTime: new Date('1970-01-01T20:00:00.000Z'),
    })

  const toEntity = (record: AttendanceRecord) =>
    new Attendance({
      ...record,
      classSession: sessions.has(record.sessionId) ? toSession(sessions.get(record.sessionId)!) : undefined,
    })

  const attendanceRepository = {
    findById: jest.fn(async (id: number) => {
      const record = records.get(id)
      if (!record) return null
      const entity = toEntity(record)
      entity.makeupBy = record.makeupByAttendanceId ? toEntity(records.get(record.makeupByAttendanceId)!) : undefined
      entity.madeUpAbsences = [...records.values()]
        .filter((item) => item.makeupByAttendanceId === id)
        .map((item) => toEntity(item))
      return entity
    }),
    findBySessionAndStudent: jest.fn(async (sessionId: number, studentId: number) => {
      const record = [...records.values()].find((item) => item.sessionId === sessionId && item.studentId === studentId)
      return record ? toEntity(record) : null
    }),
    create: jest.fn(async (data: CreateAttendanceData) => {
      const record: AttendanceRecord = {
        attendanceId: nextAttendanceId++,
        sessionId: data.sessionId,
        studentId: data.studentId,
        status: data.status,
        attendanceType: data.attendanceType ?? AttendanceType.REGULAR,
        markedAt: new Date(),
        markerId: data.markerId ?? null,
        makeupByAttendanceId: null,
      }
      records.set(record.attendanceId, record)
      return toEntity(record)
    }),
    createBulk: jest.fn(async (items: CreateAttendanceData[]) =>
      items.map((data) => {
        const record: AttendanceRecord = {
          attendanceId: nextAttendanceId++,
          sessionId: data.sessionId,
          studentId: data.studentId,
          status: data.status,
          attendanceType: data.attendanceType ?? AttendanceType.REGULAR,
          markedAt: new Date(),
          markerId: data.markerId ?? null,
          makeupByAttendanceId: null,
        }
        records.set(record.attendanceId, record)
        return toEntity(record)
      }),
    ),
    update: jest.fn(async (id: number, data: UpdateAttendanceData) => {
      const record = records.get(id)!
      const defined = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
      Object.assign(record, defined)
      return toEntity(record)
    }),
    findWithFilter: jest.fn(async (filters: { sessionId?: number; studentIds?: number[] }) =>
      [...records.values()]
        .filter(
          (item) =>
            (filters.sessionId === undefined || item.sessionId === filters.sessionId) &&
            (filters.studentIds === undefined || filters.studentIds.includes(item.studentId)),
        )
        .map((item) => toEntity(item)),
    ),
    delete: jest.fn(async (id: number) => {
      records.delete(id)
      // FK SetNull: bản ghi vắng đang trỏ tới bản ghi bị xóa quay về chưa được bù
      for (const record of records.values()) {
        if (record.makeupByAttendanceId === id) record.makeupByAttendanceId = null
      }
      return true
    }),
    findByStudentAndSessionIds: jest.fn(async (studentId: number, sessionIds: number[]) =>
      [...records.values()]
        .filter((item) => item.studentId === studentId && sessionIds.includes(item.sessionId))
        .sort((a, b) => a.attendanceId - b.attendanceId)
        .map((item) => toEntity(item)),
    ),
    findByMakeupByAttendanceId: jest.fn(async (attendanceId: number) =>
      [...records.values()]
        .filter((item) => item.makeupByAttendanceId === attendanceId)
        .sort((a, b) => a.attendanceId - b.attendanceId)
        .map((item) => toEntity(item)),
    ),
    setMakeupByAttendanceId: jest.fn(async (ids: number[], value: number | null) => {
      for (const id of ids) {
        const record = records.get(id)
        if (record) record.makeupByAttendanceId = value
      }
    }),
  }

  const sessionMakeupRegistrationRepository = {
    findBySessionIds: jest.fn(async (sessionIds: number[]) =>
      pairs
        .filter((pair) => sessionIds.includes(pair.sessionId))
        .map((pair) => ({
          sessionId: pair.sessionId,
          makeupSessionId: pair.makeupSessionId,
          makeupSession: toSession(sessions.get(pair.makeupSessionId)!),
        })),
    ),
    findByMakeupSessionIds: jest.fn(async (sessionIds: number[]) =>
      pairs
        .filter((pair) => sessionIds.includes(pair.makeupSessionId))
        .map((pair) => ({ sessionId: pair.sessionId, makeupSessionId: pair.makeupSessionId })),
    ),
  }

  const repos = {
    attendanceRepository,
    sessionMakeupRegistrationRepository,
    classSessionRepository: {
      findById: jest.fn(async (id: number) => {
        const record = sessions.get(id)
        if (!record) return null
        const session = toSession(record)
        session.courseClass = { course: { isEnded: false } } as never
        return session
      }),
    },
    studentRepository: {
      findById: jest.fn(async (studentId: number) => ({
        studentId,
        userId: studentId + 1000,
        user: { isActive: true },
      })),
    },
    classStudentRepository: {
      findByClass: jest.fn(async () => [{ studentId: STUDENT_ID, student: { userId: STUDENT_ID + 1000 } }]),
    },
    adminAuditLogRepository: { create: jest.fn().mockResolvedValue(undefined) },
  } as unknown as UnitOfWorkRepos

  const unitOfWork = {
    executeInTransaction: (work: (r: UnitOfWorkRepos) => Promise<unknown>) => work(repos),
  } as unknown as IUnitOfWork

  return {
    repos,
    unitOfWork,
    attendanceRepository,
    sessionMakeupRegistrationRepository,
    linkService: new AttendanceMakeupLinkService(),
    studentPointService: {
      awardAttendancePoints: jest.fn(async () => undefined),
      removeAttendancePoints: jest.fn(async () => undefined),
    },
    createAndNotifyOne: { executeWithRepos: jest.fn(async () => undefined) },
    createAndNotifyMany: { executeWithRepos: jest.fn(async () => undefined) },

    /** Thêm buổi học; `time` là giờ bắt đầu trong ngày. */
    addSession(sessionId: number, classId: number, date: string, time = '18:00:00') {
      sessions.set(sessionId, {
        sessionId,
        classId,
        name: `Buổi ${sessionId}`,
        sessionDate: new Date(`${date}T00:00:00.000Z`),
        startTime: new Date(`1970-01-01T${time}.000Z`),
      })
    },
    /** Hai buổi học bù được cho nhau (lưu cả hai chiều như bảng thật). */
    pair(sessionA: number, sessionB: number) {
      pairs.push({ sessionId: sessionA, makeupSessionId: sessionB })
      pairs.push({ sessionId: sessionB, makeupSessionId: sessionA })
    },
    /** Ghi trực tiếp một bản ghi điểm danh vào kho (không qua use case). */
    seed(
      sessionId: number,
      status: AttendanceStatus,
      options: { studentId?: number; type?: AttendanceType; makeupBy?: number | null } = {},
    ) {
      const record: AttendanceRecord = {
        attendanceId: nextAttendanceId++,
        sessionId,
        studentId: options.studentId ?? STUDENT_ID,
        status,
        attendanceType: options.type ?? AttendanceType.REGULAR,
        markedAt: new Date(),
        markerId: null,
        makeupByAttendanceId: options.makeupBy ?? null,
      }
      records.set(record.attendanceId, record)
      return record.attendanceId
    },
    /** Đọc bản ghi đã lưu. */
    get(attendanceId: number) {
      return records.get(attendanceId)
    },
  }
}
