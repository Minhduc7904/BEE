// src/infrastructure/repositories/prisma-user.repository.ts
import { PrismaService } from '../../prisma/prisma.service'
import type { IUserRepository, CreateUserData, UpdateUserData } from '../../domain/repositories/user.repository'
import { User } from '../../domain/entities/user/user.entity'
import { Admin } from '../../domain/entities/user/admin.entity'
import { Student } from '../../domain/entities/user/student.entity'
import { UserMapper } from '../mappers/user.mapper'
import { NumberUtil } from '../../shared/utils/number.util'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService | any) { } // any để hỗ trợ transaction client

  async create(data: CreateUserData): Promise<User> {
    const prismaUser = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        oldUserId: data.oldUserId,
        avatarId: data.avatarId,
        isActive: data.isActive ?? true,
        isEmailVerified: data.isEmailVerified ?? false,
        emailVerifiedAt: data.emailVerifiedAt,
        lastLoginAt: data.lastLoginAt,
      },
    })

    return UserMapper.toDomainUser(prismaUser)!
  }

  async findById(id: number): Promise<User | null> {
    const numericId = NumberUtil.ensureValidId(id, 'User ID')

    const prismaUser = await this.prisma.user.findUnique({
      where: { userId: numericId },
    })

    return UserMapper.toDomainUser(prismaUser)
  }

  async findByUsername(username: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { username },
    })

    return UserMapper.toDomainUser(prismaUser)
  }

  async findByUsernameWithDetails(username: string): Promise<{
    user: User
    admin?: Admin
    student?: Student
  } | null> {
    const result = await this.prisma.user.findUnique({
      where: { username },
      include: {
        admin: true,
        student: true,
        avatar: true,
      },
    })

    return UserMapper.toDomainUserWithDetails(result)
  }

  async findByEmailWithDetails(email: string): Promise<{
    user: User
    admin?: Admin
    student?: Student
  } | null> {
    const result = await this.prisma.user.findFirst({
      where: { email, isEmailVerified: true },
      include: {
        admin: true,
        student: true,
        avatar: true,
      },
    })

    return UserMapper.toDomainUserWithDetails(result)
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findFirst({
      where: { email: email, isEmailVerified: true },
    })

    return UserMapper.toDomainUser(prismaUser)
  }

  async findByOldUserId(oldUserId: number): Promise<User | null> {
    const numericOldUserId = NumberUtil.ensureValidId(oldUserId, 'Old User ID')

    const prismaUser = await this.prisma.user.findUnique({
      where: { oldUserId: numericOldUserId },
    })

    return UserMapper.toDomainUser(prismaUser)
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    const numericId = NumberUtil.ensureValidId(id, 'User ID')

    const prismaUser = await this.prisma.user.update({
      where: { userId: numericId },
      data: {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: data.isActive,
        avatarId: data.avatarId,
        isEmailVerified: data.isEmailVerified,
        emailVerifiedAt: data.emailVerifiedAt,
        lastLoginAt: data.lastLoginAt,
        updatedAt: new Date(),
      },
    })

    return UserMapper.toDomainUser(prismaUser)!
  }

  async delete(id: number): Promise<boolean> {
    const numericId = NumberUtil.ensureValidId(id, 'User ID')

    try {
      await this.prisma.user.delete({
        where: { userId: numericId },
      })
      return true
    } catch (error) {
      return false
    }
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    })
    return count > 0
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    })
    return count > 0
  }
}
