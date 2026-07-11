// src/infrastructure/mappers/user.mapper.ts
import {
  User,
  Admin,
  Student,
} from '../../../domain/entities'
import {
  AdminMapper,
  StudentMapper
} from '..'

/**
 * Mapper class để convert từ Prisma User models sang Domain User entities
 */
export class UserMapper {
  /**
   * Convert Prisma User model sang Domain User entity
   */
  static toDomainUser(prismaUser: any): User | null {
    if (!prismaUser) return null

    return new User({
      userId: prismaUser.userId,
      username: prismaUser.username,
      passwordHash: prismaUser.passwordHash,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      isActive: prismaUser.isActive,
      isEmailVerified: prismaUser.isEmailVerified ?? false,
      createdAt: prismaUser.createdAt,
      email: prismaUser.email ?? undefined,
      gender: prismaUser.gender ?? undefined,
      dateOfBirth: prismaUser.dateOfBirth ?? undefined,
      emailVerifiedAt: prismaUser.emailVerifiedAt ?? undefined,
      lastLoginAt: prismaUser.lastLoginAt ?? undefined,
      updatedAt: prismaUser.updatedAt ?? undefined,
      userRoles: prismaUser.userRoles ?? undefined,
    })
  }

  /**
   * Convert array của Prisma Users sang array của Domain Users
   */
  static toDomainUsers(prismaUsers: any[]): User[] {
    return prismaUsers.map((user) => this.toDomainUser(user)).filter(Boolean) as User[]
  }

  /**
   * Convert User với relations (admin/student) sang object với proper types
   */
  static toDomainUserWithDetails(result: any): {
    user: User
    admin?: Admin
    student?: Student
  } | null {
    if (!result) return null

    const user = this.toDomainUser(result)
    if (!user) return null

    return {
      user,
      admin: AdminMapper.toDomainAdmin(result.admin),
      student: StudentMapper.toDomainStudent(result.student),
    }
  }
}
