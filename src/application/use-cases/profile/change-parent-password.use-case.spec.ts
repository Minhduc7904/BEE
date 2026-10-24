import type { AuthenticatedUser } from '../../interfaces'
import { ForbiddenException, ValidationException } from '../../../shared/exceptions/custom-exceptions'
import { ChangeParentPasswordUseCase } from './change-parent-password.use-case'

const parent: AuthenticatedUser = {
  userId: 10,
  username: 'parent',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

describe('ChangeParentPasswordUseCase', () => {
  const userRepository = { findById: jest.fn(), update: jest.fn() }
  const passwordService = { comparePassword: jest.fn(), hashPassword: jest.fn() }
  const useCase = new ChangeParentPasswordUseCase(userRepository as never, passwordService as never)

  beforeEach(() => {
    jest.clearAllMocks()
    userRepository.findById.mockResolvedValue({ isActive: true, passwordHash: 'old-hash' })
    userRepository.update.mockResolvedValue(undefined)
    passwordService.hashPassword.mockResolvedValue('new-hash')
  })

  it('updates the hash when the old password is correct', async () => {
    passwordService.comparePassword.mockImplementation(async (plain: string) => plain === 'oldpass')

    const response = await useCase.execute(parent, { oldPassword: 'oldpass', newPassword: 'newpass' })

    expect(userRepository.update).toHaveBeenCalledWith(10, { passwordHash: 'new-hash' })
    expect(response.success).toBe(true)
  })

  it('rejects a wrong old password with 400 and changes nothing', async () => {
    passwordService.comparePassword.mockResolvedValue(false)

    await expect(useCase.execute(parent, { oldPassword: 'wrong1', newPassword: 'newpass' })).rejects.toBeInstanceOf(
      ValidationException,
    )
    expect(userRepository.update).not.toHaveBeenCalled()
  })

  it('rejects a new password equal to the old one', async () => {
    passwordService.comparePassword.mockResolvedValue(true)

    await expect(useCase.execute(parent, { oldPassword: 'samepw', newPassword: 'samepw' })).rejects.toBeInstanceOf(
      ValidationException,
    )
    expect(userRepository.update).not.toHaveBeenCalled()
  })

  it('rejects a non-parent identity', async () => {
    await expect(
      useCase.execute({ ...parent, userType: 'student', parentId: undefined }, { oldPassword: 'oldpass', newPassword: 'newpass' }),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(userRepository.findById).not.toHaveBeenCalled()
  })
})
