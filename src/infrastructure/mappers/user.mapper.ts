// src/infrastructure/mappers/user.mapper.ts
import { User } from '../../domain/entities/user/user.entity'
import { Admin } from '../../domain/entities/user/admin.entity'
import { Student } from '../../domain/entities/user/student.entity'
import { Image } from '../../domain/entities/image/image.entity'
import { StudentMapper } from './student.mapper'
import { AdminMapper } from './admin.mapper'

/**
 * Mapper class để convert từ Prisma User models sang Domain User entities
 */
export class UserMapper {
  /**
   * Convert Prisma User model sang Domain User entity
   */
  static toDomainUser(prismaUser: any): User | null {
    if (!prismaUser) return null

    // Map avatar if exists
    let avatar: Image | undefined
    if (prismaUser.avatar) {
      avatar = new Image(
        prismaUser.avatar.imageId,
        prismaUser.avatar.adminId,
        prismaUser.avatar.url,
        prismaUser.avatar.anotherUrl,
        prismaUser.avatar.mimeType,
        prismaUser.avatar.storageProvider,
        prismaUser.avatar.createdAt,
        prismaUser.avatar.updatedAt,
      )
    }

    return new User(
      prismaUser.userId,                    // 1
      prismaUser.username,                  // 2
      prismaUser.passwordHash,              // 3
      prismaUser.firstName,                 // 4
      prismaUser.lastName,                  // 5
      prismaUser.isActive,                  // 6
      prismaUser.avatarId ?? undefined,     // 7 - avatarId
      avatar,                               // 8 - avatar (now properly mapped)
      prismaUser.email ?? undefined,        // 9 - email
      prismaUser.createdAt,                 // 10 - createdAt
      prismaUser.isEmailVerified ?? false,  // 11 - isEmailVerified
      prismaUser.emailVerifiedAt ?? undefined, // 12 - emailVerifiedAt
      prismaUser.lastLoginAt ?? undefined,     // 13 - lastLoginAt
      prismaUser.updatedAt ?? undefined,       // 14 - updatedAt
      prismaUser.oldUserId ?? undefined,       // 15 - oldUserId
    )
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
