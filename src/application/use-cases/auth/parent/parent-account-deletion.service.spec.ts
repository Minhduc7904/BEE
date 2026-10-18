import { Parent } from '../../../../domain/entities/user/parent.entity'
import { User } from '../../../../domain/entities/user/user.entity'
import { ParentAccountDeletionSource } from '../../../../domain/enums/parent-account-deletion-source.enum'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../../domain/repositories'
import { ParentAccountDeletionService } from './parent-account-deletion.service'

function unitOfWork(repos: Partial<UnitOfWorkRepos>): IUnitOfWork {
  return {
    executeInTransaction: async <T>(work: (value: UnitOfWorkRepos) => Promise<T>) => work(repos as UnitOfWorkRepos),
  }
}

describe('ParentAccountDeletionService', () => {
  const phone = '0399520768'
  const deletedAt = new Date('2026-10-18T06:00:00.000Z')
  const user = new User({
    userId: 12,
    username: phone,
    passwordHash: 'old-hash',
    firstName: 'An',
    lastName: 'Nguyễn',
  })
  const parent = new Parent({ parentId: 34, userId: user.userId, phone, user })

  function createService(overrides?: { tombstone?: unknown; passwordMatches?: boolean }) {
    const deleteAccount = jest.fn().mockResolvedValue({ deletedAt })
    const findByPhone = jest.fn().mockResolvedValue(parent)
    const comparePassword = jest.fn().mockResolvedValue(overrides?.passwordMatches ?? true)
    const revoke = jest.fn().mockResolvedValue(undefined)
    const repos = {
      parentAccountDeletionRepository: {
        findByPhoneLookupHash: jest.fn().mockResolvedValue(overrides?.tombstone ?? null),
        deleteAccount,
      },
      parentRepository: { findByPhone },
    } as unknown as Partial<UnitOfWorkRepos>
    const service = new ParentAccountDeletionService(
      unitOfWork(repos),
      {
        comparePassword,
        hashPassword: jest.fn().mockResolvedValue('replacement-hash'),
      },
      { hashNormalizedPhone: jest.fn().mockReturnValue('phone-hmac') },
      { revoke },
    )
    return { service, deleteAccount, findByPhone, comparePassword, revoke }
  }

  it('xác minh mật khẩu rồi ẩn danh và thu hồi realtime', async () => {
    const { service, deleteAccount, revoke } = createService()

    const result = await service.deleteByCredentials(phone, 'Example123', ParentAccountDeletionSource.WEB)

    expect(result).toEqual({ deletedAt: expect.any(Date), userId: 12 })
    expect(deleteAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 12,
        parentId: 34,
        phoneLookupHash: 'phone-hmac',
        source: ParentAccountDeletionSource.WEB,
        deletedAt: result.deletedAt,
        replacementPasswordHash: 'replacement-hash',
      }),
    )
    expect(revoke).toHaveBeenCalledWith(12)
  })

  it('sai mật khẩu không tạo bất kỳ mutation nào', async () => {
    const { service, deleteAccount, revoke } = createService({ passwordMatches: false })

    await expect(
      service.deleteByCredentials(phone, 'wrong-password', ParentAccountDeletionSource.WEB),
    ).rejects.toMatchObject({ status: 401, response: { code: 'INVALID_CREDENTIALS' } })
    expect(deleteAccount).not.toHaveBeenCalled()
    expect(revoke).not.toHaveBeenCalled()
  })

  it('trả thành công idempotent khi tombstone đã tồn tại', async () => {
    const tombstone = { deletedAt }
    const { service, deleteAccount, findByPhone, comparePassword, revoke } = createService({ tombstone })

    await expect(service.deleteByCredentials(phone, 'any-password', ParentAccountDeletionSource.WEB)).resolves.toEqual({
      deletedAt,
      userId: undefined,
    })
    expect(findByPhone).not.toHaveBeenCalled()
    expect(comparePassword).not.toHaveBeenCalled()
    expect(deleteAccount).not.toHaveBeenCalled()
    expect(revoke).not.toHaveBeenCalled()
  })
})
