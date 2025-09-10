// src/infrastructure/repositories/prisma-student.repository.ts
import { PrismaService } from '../../prisma/prisma.service';
import type { IStudentRepository } from '../../domain/repositories/student.repository';
import type {
    CreateStudentData,
    StudentFilterOptions,
    StudentPaginationOptions,
    StudentListResult,
    StudentSortOptions
} from '../../domain/interface/student/student.interface';

import { Student } from '../../domain/entities/user/student.entity';
import { StudentMapper } from '../mappers/student.mapper';
import { NumberUtil } from '../../shared/utils/number.util';
import { PaginationMapper } from '../mappers/pagination.mapper';

export class PrismaStudentRepository implements IStudentRepository {
    constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

    async create(data: CreateStudentData): Promise<Student> {
        const numericUserId = NumberUtil.ensureValidId(data.userId, 'User ID');

        const prismaStudent = await this.prisma.student.create({
            data: {
                userId: numericUserId,
                studentPhone: data.studentPhone,
                parentPhone: data.parentPhone,
                grade: data.grade,
                school: data.school,
            },
        });

        return StudentMapper.toDomainStudent(prismaStudent)!;
    }

    async findById(id: number): Promise<Student | null> {
        const numericId = NumberUtil.ensureValidId(id, 'Student ID');

        const prismaStudent = await this.prisma.student.findUnique({
            where: { studentId: numericId },
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
                        lastLoginAt: true
                    }
                }
            },
        });

        if (!prismaStudent) return null;

        return StudentMapper.toDomainStudent(prismaStudent)!;
    }

    async findByUserId(userId: number): Promise<Student | null> {
        const numericUserId = NumberUtil.ensureValidId(userId, 'User ID');

        const prismaStudent = await this.prisma.student.findUnique({
            where: { userId: numericUserId },
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
                        lastLoginAt: true
                    }
                }
            },
        });

        if (!prismaStudent) return null;

        return StudentMapper.toDomainStudent(prismaStudent)!;
    }

    async update(id: number, data: Partial<Student>): Promise<Student> {
        const numericId = NumberUtil.ensureValidId(id, 'Student ID');

        const prismaStudent = await this.prisma.student.update({
            where: { studentId: numericId },
            data: {
                studentPhone: data.studentPhone,
                parentPhone: data.parentPhone,
                grade: data.grade,
                school: data.school,
            },
        });

        return StudentMapper.toDomainStudent(prismaStudent)!;
    }

    async delete(id: number): Promise<boolean> {
        const numericId = NumberUtil.ensureValidId(id, 'Student ID');

        try {
            await this.prisma.student.delete({
                where: { studentId: numericId },
            });
            return true;
        } catch (error) {
            return false;
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
                        lastLoginAt: true
                    }
                }
            },
        });

        return StudentMapper.toDomainStudents(prismaStudents);
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
                        lastLoginAt: true
                    }
                }
            },
        });

        return StudentMapper.toDomainStudents(prismaStudents);
    }

    // New pagination methods with case-insensitive search
    async findAllWithPagination(
        pagination: StudentPaginationOptions,
        filters?: StudentFilterOptions
    ): Promise<StudentListResult> {
        const { page, limit, sortBy } = pagination;
        const skip = (page - 1) * limit;

        // Nếu có search term, sử dụng raw query cho case-insensitive
        if (filters?.search) {
            return this.findWithRawQuery(pagination, filters);
        }

        // Ngược lại sử dụng Prisma query builder thông thường
        const where = this.buildWhereClause(filters);
        const orderBy = this.buildOrderByClause(sortBy);

        const [students, total] = await Promise.all([
            this.prisma.student.findMany({
                where,
                orderBy,
                skip,
                take: limit,
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
                            lastLoginAt: true
                        }
                    }
                },
            }),
            this.prisma.student.count({ where })
        ]);

        return PaginationMapper.toDomainDataWithPagination(students, {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }) as StudentListResult;
    }

    // Raw query method for case-insensitive search
    private async findWithRawQuery(
        pagination: StudentPaginationOptions,
        filters: StudentFilterOptions
    ): Promise<StudentListResult> {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        // Build WHERE conditions for raw query
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Search condition (case-insensitive)
        if (filters.search) {
            const searchPattern = `%${filters.search}%`;
            conditions.push(`(
                LOWER(u.username) LIKE LOWER(?) OR 
                LOWER(u.email) LIKE LOWER(?) OR 
                LOWER(u.first_name) LIKE LOWER(?) OR 
                LOWER(u.last_name) LIKE LOWER(?) OR 
                LOWER(s.school) LIKE LOWER(?)
            )`);
            params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
            paramIndex += 5;
        }

        // Other filters
        if (filters.grade !== undefined) {
            conditions.push(`s.grade = ?`);
            params.push(filters.grade);
            paramIndex++;
        }

        if (filters.school) {
            conditions.push(`LOWER(s.school) LIKE LOWER(?)`);
            params.push(`%${filters.school}%`);
            paramIndex++;
        }

        if (filters.studentPhone) {
            conditions.push(`s.student_phone LIKE ?`);
            params.push(`%${filters.studentPhone}%`);
            paramIndex++;
        }

        if (filters.parentPhone) {
            conditions.push(`s.parent_phone LIKE ?`);
            params.push(`%${filters.parentPhone}%`);
            paramIndex++;
        }

        if (filters.username) {
            conditions.push(`LOWER(u.username) LIKE LOWER(?)`);
            params.push(`%${filters.username}%`);
            paramIndex++;
        }

        if (filters.email) {
            conditions.push(`LOWER(u.email) LIKE LOWER(?)`);
            params.push(`%${filters.email}%`);
            paramIndex++;
        }

        if (filters.firstName) {
            conditions.push(`LOWER(u.first_name) LIKE LOWER(?)`);
            params.push(`%${filters.firstName}%`);
            paramIndex++;
        }

        if (filters.lastName) {
            conditions.push(`LOWER(u.last_name) LIKE LOWER(?)`);
            params.push(`%${filters.lastName}%`);
            paramIndex++;
        }

        if (filters.isActive !== undefined) {
            conditions.push(`u.is_active = ?`);
            params.push(filters.isActive);
            paramIndex++;
        }

        // Date filters
        if (filters.createdAfter) {
            conditions.push(`u.created_at >= ?`);
            params.push(filters.createdAfter);
            paramIndex++;
        }

        if (filters.createdBefore) {
            conditions.push(`u.created_at <= ?`);
            params.push(filters.createdBefore);
            paramIndex++;
        }

        if (filters.lastLoginAfter) {
            conditions.push(`u.last_login_at >= ?`);
            params.push(filters.lastLoginAfter);
            paramIndex++;
        }

        if (filters.lastLoginBefore) {
            conditions.push(`u.last_login_at <= ?`);
            params.push(filters.lastLoginBefore);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Build ORDER BY clause
        const { sortBy } = pagination;
        let orderByClause = 'ORDER BY u.created_at DESC'; // Default

        if (sortBy) {
            const { field, direction } = sortBy;
            if (['studentId', 'grade', 'school'].includes(field)) {
                orderByClause = `ORDER BY s.${field === 'studentId' ? 'student_id' : field === 'school' ? 'school' : 'grade'} ${direction}`;
            } else if (['userId', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'lastLoginAt'].includes(field)) {
                const columnMap: { [key: string]: string } = {
                    userId: 'user_id',
                    firstName: 'first_name',
                    lastName: 'last_name',
                    createdAt: 'created_at',
                    updatedAt: 'updated_at',
                    lastLoginAt: 'last_login_at'
                };
                const column = columnMap[field] || field;
                orderByClause = `ORDER BY u.${column} ${direction}`;
            }
        }

        // Count query
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM students s 
            INNER JOIN users u ON s.user_id = u.user_id 
            ${whereClause}
        `;

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
        `;

        // Execute queries
        const [countResult, dataResult] = await Promise.all([
            this.prisma.$queryRawUnsafe(countQuery, ...params) as Promise<[{ total: bigint }]>,
            this.prisma.$queryRawUnsafe(dataQuery, ...params, limit, skip) as Promise<any[]>
        ]);

        const total = Number(countResult[0].total);

        // Transform raw results to match Prisma structure
        const students = dataResult.map(row => ({
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
                lastLoginAt: row.user_lastLoginAt
            }
        }));

        return PaginationMapper.toDomainDataWithPagination(students, {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }) as StudentListResult;
    }

    async searchStudents(
        searchTerm: string,
        pagination?: StudentPaginationOptions
    ): Promise<StudentListResult> {
        const defaultPagination = pagination || { page: 1, limit: 10 };

        const filters: StudentFilterOptions = {
            search: searchTerm
        };

        return this.findAllWithPagination(defaultPagination, filters);
    }

    async findByFilters(
        filters: StudentFilterOptions,
        pagination?: StudentPaginationOptions
    ): Promise<StudentListResult> {
        const defaultPagination = pagination || { page: 1, limit: 10 };
        return this.findAllWithPagination(defaultPagination, filters);
    }

    async count(filters?: StudentFilterOptions): Promise<number> {
        const where = this.buildWhereClause(filters);
        return this.prisma.student.count({ where });
    }

    async countByGrade(grade: number): Promise<number> {
        return this.prisma.student.count({
            where: { grade }
        });
    }

    async countBySchool(school: string): Promise<number> {
        const result = await this.prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as total FROM students WHERE LOWER(school) LIKE LOWER(?)`,
            `%${school}%`
        ) as [{ total: bigint }];

        return Number(result[0].total);
    }

    // Helper methods
    private buildWhereClause(filters?: StudentFilterOptions): any {
        if (!filters) return {};

        const where: any = {};

        // Student direct fields
        if (filters.grade !== undefined) {
            where.grade = filters.grade;
        }

        if (filters.school) {
            where.school = {
                contains: filters.school
            };
        }

        if (filters.studentPhone) {
            where.studentPhone = {
                contains: filters.studentPhone
            };
        }

        if (filters.parentPhone) {
            where.parentPhone = {
                contains: filters.parentPhone
            };
        }

        // User relation fields
        const userFilters: any = {};

        if (filters.username) {
            userFilters.username = {
                contains: filters.username
            };
        }

        if (filters.email) {
            userFilters.email = {
                contains: filters.email
            };
        }

        if (filters.firstName) {
            userFilters.firstName = {
                contains: filters.firstName
            };
        }

        if (filters.lastName) {
            userFilters.lastName = {
                contains: filters.lastName
            };
        }

        if (filters.isActive !== undefined) {
            userFilters.isActive = filters.isActive;
        }

        // Date filters
        if (filters.createdAfter || filters.createdBefore) {
            userFilters.createdAt = {};
            if (filters.createdAfter) {
                userFilters.createdAt.gte = filters.createdAfter;
            }
            if (filters.createdBefore) {
                userFilters.createdAt.lte = filters.createdBefore;
            }
        }

        if (filters.lastLoginAfter || filters.lastLoginBefore) {
            userFilters.lastLoginAt = {};
            if (filters.lastLoginAfter) {
                userFilters.lastLoginAt.gte = filters.lastLoginAfter;
            }
            if (filters.lastLoginBefore) {
                userFilters.lastLoginAt.lte = filters.lastLoginBefore;
            }
        }

        // Search across multiple fields
        if (filters.search) {
            const searchTerms = {
                OR: [
                    {
                        user: {
                            username: {
                                contains: filters.search
                            }
                        }
                    },
                    {
                        user: {
                            email: {
                                contains: filters.search
                            }
                        }
                    },
                    {
                        user: {
                            firstName: {
                                contains: filters.search
                            }
                        }
                    },
                    {
                        user: {
                            lastName: {
                                contains: filters.search
                            }
                        }
                    },
                    {
                        school: {
                            contains: filters.search
                        }
                    }
                ]
            };            // Merge search with existing conditions
            if (Object.keys(where).length > 0 || Object.keys(userFilters).length > 0) {
                where.AND = [
                    searchTerms,
                    ...(Object.keys(userFilters).length > 0 ? [{ user: userFilters }] : [])
                ];
            } else {
                Object.assign(where, searchTerms);
            }
        } else if (Object.keys(userFilters).length > 0) {
            where.user = userFilters;
        }

        return where;
    }

    private buildOrderByClause(sortBy?: StudentSortOptions): any {
        if (!sortBy) {
            return { user: { createdAt: 'desc' } }; // Default sort
        }

        const { field, direction } = sortBy;

        // Student fields
        if (['studentId', 'grade', 'school'].includes(field)) {
            return { [field]: direction };
        }

        // User fields
        if (['userId', 'username', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'lastLoginAt'].includes(field)) {
            return { user: { [field]: direction } };
        }

        // Default fallback
        return { user: { createdAt: 'desc' } };
    }
}
