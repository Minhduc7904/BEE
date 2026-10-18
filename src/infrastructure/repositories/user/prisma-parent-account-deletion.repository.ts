import type { Prisma, PrismaClient } from '@prisma/client'
import { DeletedParentAccount } from '../../../domain/entities/user/deleted-parent-account.entity'
import { ParentAccountDeletionSource } from '../../../domain/enums/parent-account-deletion-source.enum'
import type {
  DeleteParentAccountData,
  IParentAccountDeletionRepository,
} from '../../../domain/repositories/parent-account-deletion.repository'

type Prismaish = Prisma.TransactionClient | PrismaClient

export class PrismaParentAccountDeletionRepository implements IParentAccountDeletionRepository {
  constructor(private readonly prisma: Prismaish) {}

  async findByPhoneLookupHash(phoneLookupHash: string): Promise<DeletedParentAccount | null> {
    const record = await this.prisma.deletedParentAccount.findUnique({ where: { phoneLookupHash } })
    return record
      ? new DeletedParentAccount(
          record.deletionId,
          record.phoneLookupHash,
          record.anonymousUserId,
          record.source as ParentAccountDeletionSource,
          record.deletedAt,
          record.createdAt,
        )
      : null
  }

  async deleteAccount(data: DeleteParentAccountData): Promise<DeletedParentAccount> {
    const record = await this.prisma.deletedParentAccount.create({
      data: {
        phoneLookupHash: data.phoneLookupHash,
        anonymousUserId: data.userId,
        source: data.source,
        deletedAt: data.deletedAt,
      },
    })

    await this.prisma.user.update({
      where: { userId: data.userId },
      data: {
        username: data.anonymousUsername,
        email: null,
        passwordHash: data.replacementPasswordHash,
        firstName: 'Tài khoản',
        lastName: 'đã xóa',
        gender: null,
        dateOfBirth: null,
        isActive: false,
        deletedAt: data.deletedAt,
        isEmailVerified: false,
        emailVerifiedAt: null,
      },
    })
    await this.prisma.parent.update({ where: { parentId: data.parentId }, data: { phone: data.anonymousPhone } })

    await Promise.all([
      this.prisma.userRefreshToken.deleteMany({ where: { userId: data.userId } }),
      this.prisma.userDevice.deleteMany({ where: { userId: data.userId } }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: data.userId } }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: data.userId } }),
      this.prisma.userNotificationSetting.deleteMany({ where: { userId: data.userId } }),
      this.prisma.parentNotificationSetting.deleteMany({ where: { parentId: data.parentId } }),
      this.prisma.notification.deleteMany({ where: { userId: data.userId } }),
    ])

    return new DeletedParentAccount(
      record.deletionId,
      record.phoneLookupHash,
      record.anonymousUserId,
      record.source as ParentAccountDeletionSource,
      record.deletedAt,
      record.createdAt,
    )
  }

  async allowRegistration(phoneLookupHash: string): Promise<boolean> {
    const result = await this.prisma.deletedParentAccount.deleteMany({ where: { phoneLookupHash } })
    return result.count > 0
  }
}
