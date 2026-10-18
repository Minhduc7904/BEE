import { Inject, Injectable, Logger } from '@nestjs/common'
import { randomBytes } from 'crypto'
import type { IUnitOfWork } from '../../../../domain/repositories'
import { ParentAccountDeletionSource } from '../../../../domain/enums/parent-account-deletion-source.enum'
import { UnauthorizedException } from '../../../../shared/exceptions/custom-exceptions'
import { PhoneUtil } from '../../../../shared/utils'
import { PasswordService } from '../../../interfaces'
import {
  ParentAccountDeletionPhoneHasher,
  ParentAccountRealtimeRevocationService,
} from '../../../interfaces/parent-account-deletion.interface'

@Injectable()
export class ParentAccountDeletionService {
  private readonly logger = new Logger(ParentAccountDeletionService.name)

  constructor(
    @Inject('UNIT_OF_WORK') private readonly unitOfWork: IUnitOfWork,
    @Inject('PASSWORD_SERVICE') private readonly passwordService: PasswordService,
    private readonly phoneHasher: ParentAccountDeletionPhoneHasher,
    private readonly realtimeRevocation: ParentAccountRealtimeRevocationService,
  ) {}

  hashPhone(phone: string): { normalizedPhone: string; phoneLookupHash: string } {
    const normalizedPhone = PhoneUtil.normalizeVietnamesePhone(phone)
    return { normalizedPhone, phoneLookupHash: this.phoneHasher.hashNormalizedPhone(normalizedPhone) }
  }

  async isDeleted(phone: string): Promise<boolean> {
    const { phoneLookupHash } = this.hashPhone(phone)
    return this.unitOfWork.executeInTransaction(async (repos) =>
      Boolean(await repos.parentAccountDeletionRepository.findByPhoneLookupHash(phoneLookupHash)),
    )
  }

  async deleteByCredentials(
    phone: string,
    password: string,
    source: ParentAccountDeletionSource,
  ): Promise<{ deletedAt: Date; userId?: number }> {
    const { normalizedPhone, phoneLookupHash } = this.hashPhone(phone)
    const result = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const existing = await repos.parentAccountDeletionRepository.findByPhoneLookupHash(phoneLookupHash)
        if (existing) return { deletedAt: existing.deletedAt, userId: undefined }

        const parent = await repos.parentRepository.findByPhone(normalizedPhone, { includeUser: true })
        if (!parent?.user || !(await this.passwordService.comparePassword(password, parent.user.passwordHash))) {
          throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS')
        }
        return this.deleteLoadedParent(repos, parent, phoneLookupHash, source)
      },
      { isolationLevel: 'Serializable' },
    )
    if (result.userId) await this.revokeRealtimeBestEffort(result.userId)
    return result
  }

  async deleteAuthenticated(userId: number, password: string): Promise<{ deletedAt: Date; userId: number }> {
    const result = await this.unitOfWork.executeInTransaction(
      async (repos) => {
        const parent = await repos.parentRepository.findByUserId(userId, { includeUser: true })
        if (!parent?.user || !(await this.passwordService.comparePassword(password, parent.user.passwordHash))) {
          throw new UnauthorizedException('Mật khẩu không đúng', 'INVALID_CREDENTIALS')
        }
        const { phoneLookupHash } = this.hashPhone(parent.phone)
        return this.deleteLoadedParent(repos, parent, phoneLookupHash, ParentAccountDeletionSource.APP)
      },
      { isolationLevel: 'Serializable' },
    )
    await this.revokeRealtimeBestEffort(userId)
    return result
  }

  private async deleteLoadedParent(
    repos: any,
    parent: any,
    phoneLookupHash: string,
    source: ParentAccountDeletionSource,
  ) {
    const deletedAt = new Date()
    const suffix = randomBytes(8).toString('hex')
    const replacementPasswordHash = await this.passwordService.hashPassword(randomBytes(32).toString('base64url'))
    await repos.parentAccountDeletionRepository.deleteAccount({
      userId: parent.userId,
      parentId: parent.parentId,
      phoneLookupHash,
      source,
      deletedAt,
      anonymousUsername: `deleted_${parent.userId}_${suffix}`.slice(0, 50),
      anonymousPhone: `d${parent.userId.toString(36)}${suffix.slice(0, 6)}`.slice(0, 15),
      replacementPasswordHash,
    })
    return { deletedAt, userId: parent.userId }
  }

  private async revokeRealtimeBestEffort(userId: number): Promise<void> {
    try {
      await this.realtimeRevocation.revoke(userId)
    } catch (error) {
      this.logger.warn(`Unable to revoke realtime session for deleted user ${userId}`)
    }
  }
}
