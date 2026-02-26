// src/infrastructure/repositories/prisma-student.repository.ts
import { PrismaService } from '../../../prisma/prisma.service'
import type { IStudentRepository } from '../../../domain/repositories'
import type {
  CreateStudentData,
  StudentFilterOptions,
  StudentPaginationOptions,
  StudentListResult,
  StudentSortOptions,
  StudentStatusStats,
} from '../../../domain/interface'
import { Student } from '../../../domain/entities'
import { StudentMapper, PaginationMapper } from '../../mappers'
import { NumberUtil, TextSearchUtil } from '../../../shared/utils'

export class PrismaStudentRepository implements IStudentRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

  /**
   * Build SQL expression to remove Vietnamese accents from a column
   * @param columnName - SQL column name (e.g., 'u.first_name')
   * @returns SQL expression with nested REPLACE functions
   */
  private buildRemoveAccentsSQL(columnName: string): string {
    const replacements = [
      // lowercase
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
      // uppercase
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
      ['Đ', 'D']
    ]

    let sql = columnName
    for (const [accented, plain] of replacements) {
      sql = `REPLACE(${sql}, '${accented}', '${plain}')`
    }
    
    return sql
  }

  private parseDate(date?: string): Date | undefined {
    if (!date) return undefined
    const d = new Date(date)
    return isNaN(d.getTime()) ? undefined : d
  }

  private normalizeFromDate(date?: Date): Date | undefined {
    if (!date) return undefined
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  private normalizeToDate(date?: Date): Date | undefined {
    if (!date) return undefined
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  async create(data: CreateStudentData): Promise<Student> {
    const numericUserId = NumberUtil.ensureValidId(data.userId, 'User ID')

    const prismaStudent = await this.prisma.student.create({
      data: {
        userId: numericUserId,
        studentPhone: data.studentPhone,
        parentPhone: data.parentPhone,
        grade: data.grade,
        school: data.school,
      },
    })

    return StudentMapper.toDomainStudent(prismaStudent)!
  }

  async findById(id: number): Promise<Student | null> {
    const numericId = NumberUtil.ensureValidId(id, 'Student ID')

    const prismaStudent = await this.prisma.student.findUnique({
      where: { studentId: numericId },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
              },
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!prismaStudent) return null

    return StudentMapper.toDomainStudent(prismaStudent)!
  }

  async findByUserId(userId: number): Promise<Student | null> {
    const numericUserId = NumberUtil.ensureValidId(userId, 'User ID')

    const prismaStudent = await this.prisma.student.findUnique({
      where: { userId: numericUserId },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
              },
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!prismaStudent) return null

    return StudentMapper.toDomainStudent(prismaStudent)!
  }

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const numericId = NumberUtil.ensureValidId(id, 'Student ID')

    const prismaStudent = await this.prisma.student.update({
      where: { studentId: numericId },
      data: {
        studentPhone: data.studentPhone,
        parentPhone: data.parentPhone,
        grade: data.grade,
        school: data.school,
      },
    })

    return StudentMapper.toDomainStudent(prismaStudent)!
  }

  async delete(id: number): Promise<boolean> {
    const numericId = NumberUtil.ensureValidId(id, 'Student ID')

    try {
      await this.prisma.student.delete({
        where: { studentId: numericId },
      })
      return true
    } catch (error) {
      return false
    }
  }

  async findByGrade(grade: number): Promise<Student[]> {
    const prismaStudents = await this.prisma.student.findMany({
      where: { grade },
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        },
      },
    })

    return StudentMapper.toDomainStudents(prismaStudents)
  }

  async findAll(): Promise<Student[]> {
    const prismaStudents = await this.prisma.student.findMany({
      include: {
        user: {
          select: {
            userId: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
          },
        },
      },
    })

    return StudentMapper.toDomainStudents(prismaStudents)
  }

  // New pagination methods with case-insensitive search
  async findAllWithPagination(
    pagination: StudentPaginationOptions,
    filters?: StudentFilterOptions,
  ): Promise<StudentListResult> {
    const { page, limit, sortBy } = pagination
    const skip = (page - 1) * limit

    // Nếu có search term, sử dụng raw query cho case-insensitive
    if (filters?.search) {
      return this.findWithRawQuery(pagination, filters)
    }

    // console.log('Filters without search:', filters);

    // Ngược lại sử dụng Prisma query builder thông thường
    const where = this.buildWhereClause(filters)
    const orderBy = this.buildOrderByClause(sortBy)

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: true,
          classStudents: {
            include: {
              courseClass: {
                select: {
                  className: true,
                  classId: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ])

    return PaginationMapper.toDomainDataWithPagination(students, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }) as StudentListResult
  }

  // Raw query method for case-insensitive search
  private async findWithRawQuery(
    pagination: StudentPaginationOptions,
    filters: StudentFilterOptions,
  ): Promise<StudentListResult> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    // Build WHERE conditions for raw query
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Search condition (case-insensitive)
    if (filters.search) {
      const searchPattern = `%${filters.search}%`
      const normalizedSearch = `%${TextSearchUtil.removeVietnameseAccents(filters.search)}%`
      
      // Build SQL expressions for accent-insensitive search
      const usernameNoAccent = this.buildRemoveAccentsSQL('u.username')
      const emailNoAccent = this.buildRemoveAccentsSQL('u.email')
      const firstNameNoAccent = this.buildRemoveAccentsSQL('u.first_name')
      const lastNameNoAccent = this.buildRemoveAccentsSQL('u.last_name')
      const schoolNoAccent = this.buildRemoveAccentsSQL('s.school')
      const fullNameNoAccent = this.buildRemoveAccentsSQL('CONCAT(u.last_name, " ", u.first_name)')
      const reverseFullNameNoAccent = this.buildRemoveAccentsSQL('CONCAT(u.first_name, " ", u.last_name)')
      
      conditions.push(`(
                LOWER(u.username) LIKE LOWER(?) OR 
                LOWER(u.email) LIKE LOWER(?) OR 
                LOWER(u.first_name) LIKE LOWER(?) OR 
                LOWER(u.last_name) LIKE LOWER(?) OR 
                LOWER(s.school) LIKE LOWER(?) OR
                LOWER(CONCAT(u.last_name, ' ', u.first_name)) LIKE LOWER(?) OR
                LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER(?) OR
                LOWER(${usernameNoAccent}) LIKE LOWER(?) OR
                LOWER(${emailNoAccent}) LIKE LOWER(?) OR
                LOWER(${firstNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${lastNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${schoolNoAccent}) LIKE LOWER(?) OR
                LOWER(${fullNameNoAccent}) LIKE LOWER(?) OR
                LOWER(${reverseFullNameNoAccent}) LIKE LOWER(?)
            )`)
      // Push original search pattern for original text search (7 params)
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
      // Push normalized search pattern for accent-removed search (7 params)
      params.push(normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch, normalizedSearch)
      paramIndex += 14
    }

    // Other filters
    if (filters.grade !== undefined) {
      conditions.push(`s.grade = ?`)
      params.push(filters.grade)
      paramIndex++
    }

    if (filters.school) {
      conditions.push(`LOWER(s.school) LIKE LOWER(?)`)
      params.push(`%${filters.school}%`)
      paramIndex++
    }

    if (filters.studentPhone) {
      conditions.push(`s.student_phone LIKE ?`)
      params.push(`%${filters.studentPhone}%`)
      paramIndex++
    }

    if (filters.parentPhone) {
      conditions.push(`s.parent_phone LIKE ?`)
      params.push(`%${filters.parentPhone}%`)
      paramIndex++
    }

    if (filters.username) {
      conditions.push(`LOWER(u.username) LIKE LOWER(?)`)
      params.push(`%${filters.username}%`)
      paramIndex++
    }

    if (filters.email) {
      conditions.push(`LOWER(u.email) LIKE LOWER(?)`)
      params.push(`%${filters.email}%`)
      paramIndex++
    }

    if (filters.firstName) {
      conditions.push(`LOWER(u.first_name) LIKE LOWER(?)`)
      params.push(`%${filters.firstName}%`)
      paramIndex++
    }

    if (filters.lastName) {
      conditions.push(`LOWER(u.last_name) LIKE LOWER(?)`)
      params.push(`%${filters.lastName}%`)
      paramIndex++
    }

    if (filters.isActive !== undefined) {
      conditions.push(`u.is_active = ?`)
      params.push(filters.isActive)
      paramIndex++
    }

    // Date filters
    if (filters.createdAfter) {
      conditions.push(`u.created_at >= ?`)
      params.push(filters.createdAfter)
      paramIndex++
    }

    if (filters.createdBefore) {
      conditions.push(`u.created_at <= ?`)
      params.push(filters.createdBefore)
      paramIndex++
    }

    if (filters.lastLoginAfter) {
      conditions.push(`u.last_login_at >= ?`)
      params.push(filters.lastLoginAfter)
      paramIndex++
    }

    if (filters.lastLoginBefore) {
      conditions.push(`u.last_login_at <= ?`)
      params.push(filters.lastLoginBefore)
      paramIndex++
    }

    const fromDate = filters.fromDate ? new Date(filters.fromDate) : undefined
    const toDate = filters.toDate ? new Date(filters.toDate) : undefined

    if (fromDate) {
      conditions.push(`u.created_at >= ?`)
      params.push(fromDate)
    }

    if (toDate) {
      conditions.push(`u.created_at <= ?`)
      params.push(toDate)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Build ORDER BY clause
    const { sortBy } = pagination
    let orderByClause = 'ORDER BY u.created_at DESC' // Default

    if (sortBy) {
      const { field, direction } = sortBy
      if (['studentId', 'grade', 'school'].includes(field)) {
        orderByClause = `ORDER BY s.${field === 'studentId' ? 'student_id' : field === 'school' ? 'school' : 'grade'} ${direction}`
      } else if (
        ['userId', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'lastLoginAt'].includes(
          field,
        )
      ) {
        const columnMap: { [key: string]: string } = {
          userId: 'user_id',
          firstName: 'first_name',
          lastName: 'last_name',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
          lastLoginAt: 'last_login_at',
        }
        const column = columnMap[field] || field
        orderByClause = `ORDER BY u.${column} ${direction}`
      }
    }

    // Count query
    const countQuery = `
            SELECT COUNT(*) as total 
            FROM students s 
            INNER JOIN users u ON s.user_id = u.user_id 
            ${whereClause}
        `

    // Data query
    const dataQuery = `
            SELECT 
                s.student_id as studentId,
                s.user_id as userId, 
                s.student_phone as studentPhone,
                s.parent_phone as parentPhone,
                s.grade,
                s.school,
                u.user_id as user_userId,
                u.username as user_username,
                u.email as user_email,
                u.first_name as user_firstName,
                u.last_name as user_lastName,
                u.is_active as user_isActive,
                u.created_at as user_createdAt,
                u.updated_at as user_updatedAt,
                u.last_login_at as user_lastLoginAt
            FROM students s 
            INNER JOIN users u ON s.user_id = u.user_id 
            ${whereClause}
            ${orderByClause}
            LIMIT ? OFFSET ?
        `

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<[{ total: bigint }]>,
      this.prisma.$queryRawUnsafe(dataQuery, ...params, limit, skip) as Promise<any[]>,
    ])

    const total = Number(countResult[0].total)

    // Transform raw results to match Prisma structure
    const students = dataResult.map((row) => ({
      studentId: row.studentId,
      userId: row.userId,
      studentPhone: row.studentPhone,
      parentPhone: row.parentPhone,
      grade: row.grade,
      school: row.school,
      user: {
        userId: row.user_userId,
        username: row.user_username,
        email: row.user_email,
        firstName: row.user_firstName,
        lastName: row.user_lastName,
        isActive: Boolean(row.user_isActive),
        createdAt: row.user_createdAt,
        updatedAt: row.user_updatedAt,
        lastLoginAt: row.user_lastLoginAt,
      },
    }))

    return PaginationMapper.toDomainDataWithPagination(students, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }) as StudentListResult
  }

  async searchStudents(searchTerm: string, pagination?: StudentPaginationOptions): Promise<StudentListResult> {
    const defaultPagination = pagination || { page: 1, limit: 10 }

    const filters: StudentFilterOptions = {
      search: searchTerm,
    }

    return this.findAllWithPagination(defaultPagination, filters)
  }

  async findByFilters(
    filters: StudentFilterOptions,
    pagination?: StudentPaginationOptions,
  ): Promise<StudentListResult> {
    const defaultPagination = pagination || { page: 1, limit: 10 }
    return this.findAllWithPagination(defaultPagination, filters)
  }

  async count(filters?: StudentFilterOptions): Promise<number> {
    const where = this.buildWhereClause(filters)
    return this.prisma.student.count({ where })
  }

  async countByGrade(grade: number): Promise<number> {
    return this.prisma.student.count({
      where: { grade },
    })
  }

  async findOneByFilters(filters: StudentFilterOptions): Promise<Student | null> {
    const where = this.buildWhereClause(filters)
    const prismaStudent = await this.prisma.student.findFirst({
      where,
      include: {
        user: true,
      },
    })
    if (!prismaStudent) return null

    return StudentMapper.toDomainStudent(prismaStudent)!
  }

  async countBySchool(school: string): Promise<number> {
    const result = (await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as total FROM students WHERE LOWER(school) LIKE LOWER(?)`,
      `%${school}%`,
    )) as [{ total: bigint }]

    return Number(result[0].total)
  }

  // Helper methods
  private buildWhereClause(filters?: StudentFilterOptions): any {
    if (!filters) return {}

    const where: any = {}
    const userFilters: any = {}

    const rawFromDate = this.parseDate(filters.fromDate)
    const rawToDate = this.parseDate(filters.toDate)

    const fromDate = this.normalizeFromDate(rawFromDate)
    const toDate = this.normalizeToDate(rawToDate)

    if (fromDate || toDate) {
      userFilters.createdAt = {}

      if (fromDate) {
        userFilters.createdAt.gte = fromDate
      }

      if (toDate) {
        userFilters.createdAt.lte = toDate
      }
    }
    // ===== existing user filters =====
    if (filters.username) {
      userFilters.username = { contains: filters.username }
    }

    if (filters.email) {
      userFilters.email = { contains: filters.email }
    }

    if (filters.firstName) {
      userFilters.firstName = { contains: filters.firstName }
    }

    if (filters.lastName) {
      userFilters.lastName = { contains: filters.lastName }
    }

    if (filters.parentPhone) {
      where.parentPhone = { contains: filters.parentPhone }
    }

    if (filters.studentPhone) {
      where.studentPhone = { contains: filters.studentPhone }
    }

    if (filters.isActive !== undefined) {
      userFilters.isActive = filters.isActive
    }

    // ===== student filters =====
    if (filters.grade !== undefined) {
      where.grade = filters.grade
    }

    if (filters.school) {
      where.school = { contains: filters.school }
    }

    // ===== attach user =====
    if (Object.keys(userFilters).length > 0) {
      where.user = userFilters
    }

    return where
  }

  async statsByStatus(filters?: StudentFilterOptions): Promise<StudentStatusStats[]> {
    const conditions: string[] = []
    const params: any[] = []

    const rawFromDate = this.parseDate(filters?.fromDate)
    const rawToDate = this.parseDate(filters?.toDate)

    const fromDate = this.normalizeFromDate(rawFromDate)
    const toDate = this.normalizeToDate(rawToDate)

    if (fromDate) {
      conditions.push(`u.created_at >= ?`)
      params.push(fromDate)
    }

    if (toDate) {
      conditions.push(`u.created_at <= ?`)
      params.push(toDate)
    }

    if (filters?.grade !== undefined) {
      conditions.push(`s.grade = ?`)
      params.push(filters.grade)
    }

    if (filters?.isActive !== undefined) {
      conditions.push(`u.is_active = ?`)
      params.push(filters.isActive ? 1 : 0)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const sql = `
    SELECT 
      u.is_active AS isActive,
      COUNT(*)    AS total
    FROM students s
    INNER JOIN users u ON u.user_id = s.user_id
    ${whereClause}
    GROUP BY u.is_active
  `

    const stats = (await this.prisma.$queryRawUnsafe(sql, ...params)) as { isActive: number; total: bigint }[]

    return stats.map((s) => ({
      status: s.isActive === 1 ? 'ACTIVE' : 'INACTIVE',
      total: Number(s.total),
    }))
  }

  async statsByGrade(filters?: StudentFilterOptions): Promise<
    {
      grade: number
      active: number
      inactive: number
    }[]
  > {
    const conditions: string[] = []
    const params: any[] = []

    const rawFromDate = this.parseDate(filters?.fromDate)
    const rawToDate = this.parseDate(filters?.toDate)

    const fromDate = this.normalizeFromDate(rawFromDate)
    const toDate = this.normalizeToDate(rawToDate)

    // ===== date filter =====
    if (fromDate) {
      conditions.push(`u.created_at >= ?`)
      params.push(fromDate)
    }

    if (toDate) {
      conditions.push(`u.created_at <= ?`)
      params.push(toDate)
    }

    // ===== grade filter (nếu FE filter theo grade) =====
    if (filters?.grade !== undefined) {
      conditions.push(`s.grade = ?`)
      params.push(filters.grade)
    }

    // ===== user active filter (nếu có) =====
    if (filters?.isActive !== undefined) {
      conditions.push(`u.is_active = ?`)
      params.push(filters.isActive ? 1 : 0)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    /**
     * MySQL note:
     * - BOOLEAN = TINYINT(1)
     * - COUNT(CASE WHEN ...) là cách chuẩn để pivot
     */
    const sql = `
    SELECT
      s.grade AS grade,
      COUNT(CASE WHEN u.is_active = 1 THEN 1 END) AS active,
      COUNT(CASE WHEN u.is_active = 0 THEN 1 END) AS inactive
    FROM students s
    INNER JOIN users u ON u.user_id = s.user_id
    ${whereClause}
    GROUP BY s.grade
    ORDER BY s.grade ASC
  `

    const result = (await this.prisma.$queryRawUnsafe(sql, ...params)) as {
      grade: number
      active: bigint
      inactive: bigint
    }[]

    return result.map((row) => ({
      grade: row.grade,
      active: Number(row.active),
      inactive: Number(row.inactive),
    }))
  }

  private buildOrderByClause(sortBy?: StudentSortOptions): any {
    if (!sortBy) {
      return { user: { createdAt: 'desc' } } // Default sort
    }

    const { field, direction } = sortBy

    // Student fields
    if (['studentId', 'grade', 'school'].includes(field)) {
      return { [field]: direction }
    }

    // User fields
    if (
      ['userId', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'lastLoginAt'].includes(field)
    ) {
      return { user: { [field]: direction } }
    }

    // Default fallback
    return { user: { createdAt: 'desc' } }
  }
}
