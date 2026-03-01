// src/infrastructure/repositories/prisma-attendance.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IAttendanceRepository } from '../../../domain/repositories/attendance.repository'
import type {
  CreateAttendanceData,
  UpdateAttendanceData,
  AttendanceFilterOptions,
  AttendancePaginationOptions,
  AttendanceListResult,
} from '../../../domain/interface/attendance/attendance.interface'
import { Attendance } from '../../../domain/entities/attendance/attendance.entity'
import { AttendanceMapper } from '../../mappers/attendance/attendance.mapper'
import { NumberUtil } from '../../../shared/utils/number.util'
import { TextSearchUtil } from '../../../shared/utils/text-search.util'

export class PrismaAttendanceRepository implements IAttendanceRepository {
  constructor(private readonly prisma: PrismaService | any) { }

  async create(data: CreateAttendanceData): Promise<Attendance> {
    const prismaAttendance = await this.prisma.attendance.create({
      data: {
        sessionId: data.sessionId,
        studentId: data.studentId,
        status: data.status,
        notes: data.notes,
        markerId: data.markerId,
        markedAt: new Date(),
      },
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
    })

    return AttendanceMapper.toDomainAttendance(prismaAttendance)!
  }

  async findById(id: number): Promise<Attendance | null> {
    const attendanceId = NumberUtil.ensureValidId(id, 'Attendance ID')

    const prismaAttendance = await this.prisma.attendance.findUnique({
      where: { attendanceId },
      include: {
        classSession: {
          include: {
            courseClass: {
              include: {
                instructor: {
                  include: { user: true },
                },
              },
            },
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
    })

    if (!prismaAttendance) return null
    return AttendanceMapper.toDomainAttendance(prismaAttendance)!
  }

  async update(id: number, data: UpdateAttendanceData): Promise<Attendance> {
    const attendanceId = NumberUtil.ensureValidId(id, 'Attendance ID')

    const prismaAttendance = await this.prisma.attendance.update({
      where: { attendanceId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
    })

    return AttendanceMapper.toDomainAttendance(prismaAttendance)!
  }

  async delete(id: number): Promise<boolean> {
    const attendanceId = NumberUtil.ensureValidId(id, 'Attendance ID')

    await this.prisma.attendance.delete({
      where: { attendanceId },
    })

    return true
  }

  async findAll(): Promise<Attendance[]> {
    const prismaAttendances = await this.prisma.attendance.findMany({
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    })

    return AttendanceMapper.toDomainAttendances(prismaAttendances)
  }

  async findAllWithPagination(
    pagination: AttendancePaginationOptions,
    filters?: AttendanceFilterOptions,
  ): Promise<AttendanceListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'markedAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    if (filters?.search) {
      return this.findWithRawQuery(pagination, filters)
    }

    const where: any = {}

    if (filters?.sessionId !== undefined) {
      where.sessionId = filters.sessionId
    }

    if (filters?.studentId !== undefined) {
      where.studentId = filters.studentId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    // Filter by classId through classSession relation
    if (filters?.classId !== undefined) {
      where.classSession = {
        classId: filters.classId,
      }
    }

    // Filter by date range (markedAt)
    if (filters?.fromDate || filters?.toDate) {
      where.markedAt = {}

      if (filters.fromDate) {
        where.markedAt.gte = new Date(filters.fromDate)
      }

      if (filters.toDate) {
        // Set time to end of day (23:59:59.999)
        const toDate = new Date(filters.toDate)
        toDate.setHours(23, 59, 59, 999)
        where.markedAt.lte = toDate
      }
    }

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [prismaAttendances, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          classSession: {
            include: {
              courseClass: true,
            },
          },
          student: {
            include: { user: true },
          },
          marker: {
            include: { user: true },
          },
        },
      }),
      this.prisma.attendance.count({ where }),
    ])

    const data = AttendanceMapper.toDomainAttendances(prismaAttendances)
    const totalPages = Math.ceil(total / limit)

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async findWithFilter(filters: AttendanceFilterOptions): Promise<Attendance[]> {
    const { sessionId, studentId, studentIds, classId, status, fromDate, toDate } = filters

    const where: any = {
      ...(sessionId && { sessionId }),
      ...(status && { status }),
    }

    /**
     * Student filter
     * - Ưu tiên studentIds (bulk / stats)
     * - Nếu không có thì dùng studentId
     */
    if (studentIds?.length) {
      where.studentId = { in: studentIds }
    } else if (studentId) {
      where.studentId = studentId
    }

    /**
     * Filter theo classId thông qua classSession
     */
    if (classId) {
      where.classSession = { classId }
    }

    /**
     * MarkedAt filter
     * - Áp dụng khi có fromDate / toDate
     */
    if (fromDate || toDate) {
      where.markedAt = {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && {
          lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
        }),
      }
    }

    const prismaAttendances = await this.prisma.attendance.findMany({
      where,
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    })

    return AttendanceMapper.toDomainAttendances(prismaAttendances)
  }

  async findBySession(sessionId: number): Promise<Attendance[]> {
    const id = NumberUtil.ensureValidId(sessionId, 'Session ID')

    const prismaAttendances = await this.prisma.attendance.findMany({
      where: { sessionId: id },
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
      orderBy: {
        student: {
          user: {
            lastName: 'asc',
          },
        },
      },
    })

    return AttendanceMapper.toDomainAttendances(prismaAttendances)
  }

  async findByStudent(studentId: number): Promise<Attendance[]> {
    const id = NumberUtil.ensureValidId(studentId, 'Student ID')

    const prismaAttendances = await this.prisma.attendance.findMany({
      where: { studentId: id },
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
      orderBy: {
        markedAt: 'desc',
      },
    })

    return AttendanceMapper.toDomainAttendances(prismaAttendances)
  }

  async findBySessionAndStudent(sessionId: number, studentId: number): Promise<Attendance | null> {
    const sId = NumberUtil.ensureValidId(sessionId, 'Session ID')
    const stId = NumberUtil.ensureValidId(studentId, 'Student ID')

    const prismaAttendance = await this.prisma.attendance.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: sId,
          studentId: stId,
        },
      },
      include: {
        classSession: {
          include: {
            courseClass: true,
          },
        },
        student: {
          include: { user: true },
        },
        marker: {
          include: { user: true },
        },
      },
    })

    if (!prismaAttendance) return null
    return AttendanceMapper.toDomainAttendance(prismaAttendance)!
  }

  async createBulk(data: CreateAttendanceData[]): Promise<Attendance[]> {
    if (data.length === 0) {
      return []
    }
    await this.prisma.attendance.createMany({
      data: data.map(item => ({
        sessionId: item.sessionId,
        studentId: item.studentId,
        status: item.status,
        notes: item.notes,
        markerId: item.markerId,
        markedAt: new Date(),
      })),
      skipDuplicates: true,
    })

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        OR: data.map(item => ({
          sessionId: item.sessionId,
          studentId: item.studentId,
        })),
      },
    })

    return AttendanceMapper.toDomainAttendances(attendanceRecords)
  }

  async updateBulk(updates: Array<{ id: number; data: UpdateAttendanceData }>): Promise<Attendance[]> {
    const updatedAttendances = await Promise.all(updates.map((item) => this.update(item.id, item.data)))
    return updatedAttendances
  }

  async count(filters?: AttendanceFilterOptions): Promise<number> {
    const where: any = {}

    if (filters?.sessionId !== undefined) {
      where.sessionId = filters.sessionId
    }

    if (filters?.studentId !== undefined) {
      where.studentId = filters.studentId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.classId !== undefined) {
      where.classSession = {
        classId: filters.classId,
      }
    }

    return this.prisma.attendance.count({ where })
  }

  async countBySession(sessionId: number): Promise<number> {
    const id = NumberUtil.ensureValidId(sessionId, 'Session ID')
    return this.prisma.attendance.count({ where: { sessionId: id } })
  }

  async countByStudent(studentId: number): Promise<number> {
    const id = NumberUtil.ensureValidId(studentId, 'Student ID')
    return this.prisma.attendance.count({ where: { studentId: id } })
  }

  private buildRemoveAccentsSQL(columnName: string): string {
    const replacements = [
      ['à', 'a'], ['á', 'a'], ['ạ', 'a'], ['ả', 'a'], ['ã', 'a'],
      ['â', 'a'], ['ầ', 'a'], ['ấ', 'a'], ['ậ', 'a'], ['ẩ', 'a'], ['ẫ', 'a'],
      ['ă', 'a'], ['ằ', 'a'], ['ắ', 'a'], ['ặ', 'a'], ['ẳ', 'a'], ['ẵ', 'a'],
      ['è', 'e'], ['é', 'e'], ['ẹ', 'e'], ['ẻ', 'e'], ['ẽ', 'e'],
      ['ê', 'e'], ['ề', 'e'], ['ế', 'e'], ['ệ', 'e'], ['ể', 'e'], ['ễ', 'e'],
      ['ì', 'i'], ['í', 'i'], ['ị', 'i'], ['ỉ', 'i'], ['ĩ', 'i'],
      ['ò', 'o'], ['ó', 'o'], ['ọ', 'o'], ['ỏ', 'o'], ['õ', 'o'],
      ['ô', 'o'], ['ồ', 'o'], ['ố', 'o'], ['ộ', 'o'], ['ổ', 'o'], ['ỗ', 'o'],
      ['ơ', 'o'], ['ờ', 'o'], ['ớ', 'o'], ['ợ', 'o'], ['ở', 'o'], ['ỡ', 'o'],
      ['ù', 'u'], ['ú', 'u'], ['ụ', 'u'], ['ủ', 'u'], ['ũ', 'u'],
      ['ư', 'u'], ['ừ', 'u'], ['ứ', 'u'], ['ự', 'u'], ['ử', 'u'], ['ữ', 'u'],
      ['ỳ', 'y'], ['ý', 'y'], ['ỵ', 'y'], ['ỷ', 'y'], ['ỹ', 'y'],
      ['đ', 'd'],
      ['À', 'A'], ['Á', 'A'], ['Ạ', 'A'], ['Ả', 'A'], ['Ã', 'A'],
      ['Â', 'A'], ['Ầ', 'A'], ['Ấ', 'A'], ['Ậ', 'A'], ['Ẩ', 'A'], ['Ẫ', 'A'],
      ['Ă', 'A'], ['Ằ', 'A'], ['Ắ', 'A'], ['Ặ', 'A'], ['Ẳ', 'A'], ['Ẵ', 'A'],
      ['È', 'E'], ['É', 'E'], ['Ẹ', 'E'], ['Ẻ', 'E'], ['Ẽ', 'E'],
      ['Ê', 'E'], ['Ề', 'E'], ['Ế', 'E'], ['Ệ', 'E'], ['Ể', 'E'], ['Ễ', 'E'],
      ['Ì', 'I'], ['Í', 'I'], ['Ị', 'I'], ['Ỉ', 'I'], ['Ĩ', 'I'],
      ['Ò', 'O'], ['Ó', 'O'], ['Ọ', 'O'], ['Ỏ', 'O'], ['Õ', 'O'],
      ['Ô', 'O'], ['Ồ', 'O'], ['Ố', 'O'], ['Ộ', 'O'], ['Ổ', 'O'], ['Ỗ', 'O'],
      ['Ơ', 'O'], ['Ờ', 'O'], ['Ớ', 'O'], ['Ợ', 'O'], ['Ở', 'O'], ['Ỡ', 'O'],
      ['Ù', 'U'], ['Ú', 'U'], ['Ụ', 'U'], ['Ủ', 'U'], ['Ũ', 'U'],
      ['Ư', 'U'], ['Ừ', 'U'], ['Ứ', 'U'], ['Ự', 'U'], ['Ử', 'U'], ['Ữ', 'U'],
      ['Ỳ', 'Y'], ['Ý', 'Y'], ['Ỵ', 'Y'], ['Ỷ', 'Y'], ['Ỹ', 'Y'],
      ['Đ', 'D'],
    ]
    let sql = columnName
    for (const [accented, plain] of replacements) {
      sql = `REPLACE(${sql}, '${accented}', '${plain}')`
    }
    return sql
  }

  private async findWithRawQuery(
    pagination: AttendancePaginationOptions,
    filters: AttendanceFilterOptions,
  ): Promise<AttendanceListResult> {
    const page = pagination.page || 1
    const limit = pagination.limit || 10
    const sortBy = pagination.sortBy || 'markedAt'
    const sortOrder = pagination.sortOrder || 'desc'
    const skip = (page - 1) * limit

    const conditions: string[] = []
    const params: any[] = []

    const needClassJoin = filters.classId !== undefined

    if (filters.sessionId !== undefined) {
      conditions.push('a.session_id = ?')
      params.push(filters.sessionId)
    }

    if (filters.studentId !== undefined) {
      conditions.push('a.student_id = ?')
      params.push(filters.studentId)
    }

    if (filters.status) {
      conditions.push('a.status = ?')
      params.push(filters.status)
    }

    if (filters.classId !== undefined) {
      conditions.push('cs.class_id = ?')
      params.push(filters.classId)
    }

    if (filters.fromDate) {
      conditions.push('a.marked_at >= ?')
      params.push(new Date(filters.fromDate))
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate)
      toDate.setHours(23, 59, 59, 999)
      conditions.push('a.marked_at <= ?')
      params.push(toDate)
    }

    if (filters.search) {
      const searchPattern = `%${filters.search}%`
      const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(filters.search)}%`

      const firstNameNoAccent = this.buildRemoveAccentsSQL('u.first_name')
      const lastNameNoAccent = this.buildRemoveAccentsSQL('u.last_name')
      const fullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.last_name, ' ', u.first_name)`)
      const reverseFullNameNoAccent = this.buildRemoveAccentsSQL(`CONCAT(u.first_name, ' ', u.last_name)`)
      const notesNoAccent = this.buildRemoveAccentsSQL('a.notes')

      conditions.push(`(
        LOWER(u.first_name) LIKE LOWER(?) OR
        LOWER(u.last_name) LIKE LOWER(?) OR
        LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER(?) OR
        LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER(?) OR
        LOWER(IFNULL(a.notes, '')) LIKE LOWER(?) OR
        LOWER(${firstNameNoAccent}) LIKE LOWER(?) OR
        LOWER(${lastNameNoAccent}) LIKE LOWER(?) OR
        LOWER(${fullNameNoAccent}) LIKE LOWER(?) OR
        LOWER(${reverseFullNameNoAccent}) LIKE LOWER(?) OR
        LOWER(IFNULL(${notesNoAccent}, '')) LIKE LOWER(?)
      )`)
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
      params.push(normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const classJoin = needClassJoin
      ? 'INNER JOIN class_sessions cs ON a.session_id = cs.session_id'
      : ''

    const columnMap: Record<string, string> = {
      markedAt: 'a.marked_at',
      status: 'a.status',
      studentId: 'a.student_id',
      sessionId: 'a.session_id',
    }
    const orderColumn = columnMap[sortBy] || 'a.marked_at'
    const orderByClause = `ORDER BY ${orderColumn} ${sortOrder}`

    const baseFrom = `
      FROM attendances a
      INNER JOIN students s ON a.student_id = s.student_id
      INNER JOIN users u ON s.user_id = u.user_id
      ${classJoin}
      ${whereClause}
    `

    const countQuery = `SELECT COUNT(*) as total ${baseFrom}`
    const idsQuery = `SELECT a.attendance_id ${baseFrom} ${orderByClause} LIMIT ? OFFSET ?`

    const [countResult, idsResult] = await Promise.all([
      this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<[{ total: bigint }]>,
      this.prisma.$queryRawUnsafe(idsQuery, ...params, limit, skip) as Promise<{ attendance_id: number }[]>,
    ])

    const total = Number(countResult[0].total)
    const ids = idsResult.map((r: any) => r.attendance_id)

    const attendances = ids.length === 0
      ? []
      : await this.prisma.attendance.findMany({
          where: { attendanceId: { in: ids } },
          include: {
            classSession: { include: { courseClass: true } },
            student: { include: { user: true } },
            marker: { include: { user: true } },
          },
        })

    // Re-sort to match raw query order
    const idOrder = new Map(ids.map((id: number, i: number) => [id, i]))
    attendances.sort((a: any, b: any) => (idOrder.get(a.attendanceId) ?? 0) - (idOrder.get(b.attendanceId) ?? 0))

    return {
      data: AttendanceMapper.toDomainAttendances(attendances),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
