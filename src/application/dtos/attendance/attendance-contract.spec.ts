import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { AttendanceStatus, AttendanceStatusLabels, AttendanceType, AttendanceTypeLabels } from '../../../shared/enums'
import { ENUM_VALUES } from '../../../shared/constants/enum.constants'
import { PrismaAttendanceRepository } from '../../../infrastructure/repositories/attendance/prisma-attendance.repository'
import { AttendanceMapper } from '../../../infrastructure/mappers/attendance/attendance.mapper'
import { AttendanceListQueryDto } from './attendance-list-query.dto'
import { AttendanceResponseDto } from './attendance.dto'
import { CreateAttendanceDto } from './create-attendance.dto'
import { CreateBulkAttendanceBySessionDto } from './create-bulk-attendance-by-session.dto'
import { UpdateAttendanceDto } from './update-attendance.dto'

const messagesFor = async (cls: new () => object, body: Record<string, unknown>) =>
  (await validate(plainToInstance(cls, body))).map((error) => error.property)

describe('contract enum attendance', () => {
  it('status chỉ gồm PRESENT, ABSENT, LATE', () => {
    expect(Object.values(AttendanceStatus).sort()).toEqual(['ABSENT', 'LATE', 'PRESENT'])
    expect(Object.keys(AttendanceStatusLabels).sort()).toEqual(['ABSENT', 'LATE', 'PRESENT'])
  })

  it('type chỉ gồm REGULAR, MAKEUP và có nhãn dùng chung', () => {
    expect(Object.values(AttendanceType).sort()).toEqual(['MAKEUP', 'REGULAR'])
    expect(AttendanceTypeLabels[AttendanceType.MAKEUP]).toBe('Học bù')
    expect(ENUM_VALUES.ATTENDANCE_TYPE.labels).toBe(AttendanceTypeLabels)
  })
})

describe('DTO create/update/bulk', () => {
  it('create: status không hợp lệ bị từ chối', async () => {
    expect(await messagesFor(CreateAttendanceDto, { sessionId: 1, studentId: 2, status: 'MAKEUP' })).toContain('status')
    expect(await messagesFor(CreateAttendanceDto, { sessionId: 1, studentId: 2, status: 'WHATEVER' })).toContain('status')
  })

  it('create: attendanceType không hợp lệ bị từ chối, bỏ trống thì hợp lệ', async () => {
    expect(
      await messagesFor(CreateAttendanceDto, { sessionId: 1, studentId: 2, status: 'PRESENT', attendanceType: 'LATE' }),
    ).toContain('attendanceType')
    expect(await messagesFor(CreateAttendanceDto, { sessionId: 1, studentId: 2, status: 'PRESENT' })).toEqual([])
    expect(
      await messagesFor(CreateAttendanceDto, { sessionId: 1, studentId: 2, status: 'PRESENT', attendanceType: 'MAKEUP' }),
    ).toEqual([])
  })

  it('update/bulk: attendanceType không hợp lệ bị từ chối, giá trị hợp lệ được chấp nhận', async () => {
    expect(await messagesFor(UpdateAttendanceDto, { attendanceType: 'OTHER' })).toContain('attendanceType')
    expect(await messagesFor(UpdateAttendanceDto, { attendanceType: 'MAKEUP' })).toEqual([])
    expect(await messagesFor(UpdateAttendanceDto, { status: 'MAKEUP' })).toContain('status')
    expect(await messagesFor(CreateBulkAttendanceBySessionDto, { sessionId: 1, attendanceType: 'OTHER' })).toContain(
      'attendanceType',
    )
    expect(await messagesFor(CreateBulkAttendanceBySessionDto, { sessionId: 1, attendanceType: 'MAKEUP' })).toEqual([])
  })
})

describe('AttendanceListQueryDto', () => {
  it('lọc theo attendanceType độc lập với status', async () => {
    const dto = plainToInstance(AttendanceListQueryDto, { attendanceType: 'MAKEUP', status: 'PRESENT' })

    expect(await validate(dto)).toHaveLength(0)
    expect(dto.toAttendanceFilterOptions()).toMatchObject({ attendanceType: 'MAKEUP', status: 'PRESENT' })
    expect(plainToInstance(AttendanceListQueryDto, { attendanceType: 'REGULAR' }).toAttendanceFilterOptions()).toMatchObject({
      attendanceType: 'REGULAR',
      status: undefined,
    })
  })

  it('từ chối attendanceType không hợp lệ', async () => {
    expect(await validate(plainToInstance(AttendanceListQueryDto, { attendanceType: 'PRESENT' }))).not.toHaveLength(0)
  })

  it('cho phép sort theo attendanceType', () => {
    const dto = plainToInstance(AttendanceListQueryDto, { sortBy: 'attendanceType', sortOrder: 'asc' })

    expect(dto.toAttendancePaginationOptions()).toMatchObject({ sortBy: 'attendanceType', sortOrder: 'asc' })
  })
})

describe('Attendance entity / mapper / response', () => {
  it('entity mặc định REGULAR và mapper không trả undefined', () => {
    expect(new Attendance({ attendanceId: 1, sessionId: 1, studentId: 1, status: AttendanceStatus.PRESENT }).attendanceType).toBe(
      AttendanceType.REGULAR,
    )

    const mapped = AttendanceMapper.toDomainAttendance({
      attendanceId: 1,
      sessionId: 1,
      studentId: 1,
      status: 'PRESENT',
      attendanceType: 'MAKEUP',
      markedAt: new Date(),
      updatedAt: new Date(),
      notes: null,
      markerId: null,
    } as never)
    expect(mapped.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('response mang status/type và label tách biệt', () => {
    const dto = new AttendanceResponseDto(
      new Attendance({
        attendanceId: 1,
        sessionId: 1,
        studentId: 1,
        status: AttendanceStatus.PRESENT,
        attendanceType: AttendanceType.MAKEUP,
      }),
    )

    expect(dto).toMatchObject({
      status: 'PRESENT',
      statusLabel: 'Có mặt',
      attendanceType: 'MAKEUP',
      attendanceTypeLabel: 'Học bù',
    })
  })
})

describe('PrismaAttendanceRepository attendanceType', () => {
  function repoWith(rows: unknown[] = []) {
    const prisma = {
      attendance: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue(rows),
        count: jest.fn().mockResolvedValue(rows.length),
      },
    }
    return { prisma, repository: new PrismaAttendanceRepository(prisma) }
  }

  it('list truyền filter attendanceType vào where và sort theo attendanceType', async () => {
    const { prisma, repository } = repoWith()

    await repository.findAllWithPagination(
      { page: 1, limit: 10, sortBy: 'attendanceType', sortOrder: 'asc' },
      { attendanceType: AttendanceType.MAKEUP, status: AttendanceStatus.PRESENT },
    )

    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { attendanceType: 'MAKEUP', status: 'PRESENT' },
        orderBy: { attendanceType: 'asc' },
      }),
    )
  })

  it('filter REGULAR không lẫn với status', async () => {
    const { prisma, repository } = repoWith()

    await repository.findAllWithPagination({ page: 1, limit: 10 }, { attendanceType: AttendanceType.REGULAR })

    expect(prisma.attendance.count).toHaveBeenCalledWith({ where: { attendanceType: 'REGULAR' } })
  })
})
