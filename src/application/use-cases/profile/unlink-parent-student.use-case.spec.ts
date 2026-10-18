import type { AuthenticatedUser } from '../../interfaces'
import { ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { UnlinkParentStudentUseCase } from './unlink-parent-student.use-case'

const parent: AuthenticatedUser = {
  userId: 10,
  username: 'parent',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

describe('UnlinkParentStudentUseCase', () => {
  const parentStudentRepository = { exists: jest.fn(), delete: jest.fn() }
  const revocation = { revokeStudentAccess: jest.fn() }
  const useCase = new UnlinkParentStudentUseCase(parentStudentRepository as never, revocation as never)

  beforeEach(() => {
    jest.clearAllMocks()
    parentStudentRepository.exists.mockResolvedValue(true)
    parentStudentRepository.delete.mockResolvedValue(true)
    revocation.revokeStudentAccess.mockResolvedValue(undefined)
  })

  it('removes the link and then revokes the parent realtime subscriptions for that student', async () => {
    const response = await useCase.execute(parent, 12)

    expect(parentStudentRepository.delete).toHaveBeenCalledWith(20, 12)
    expect(revocation.revokeStudentAccess).toHaveBeenCalledWith(10, 12)
    expect(parentStudentRepository.delete.mock.invocationCallOrder[0]).toBeLessThan(
      revocation.revokeStudentAccess.mock.invocationCallOrder[0],
    )
    expect(response.data).toEqual({ unlinked: true })
  })

  it('still succeeds when the realtime revocation fails', async () => {
    revocation.revokeStudentAccess.mockRejectedValue(new Error('socket server down'))

    await expect(useCase.execute(parent, 12)).resolves.toMatchObject({ data: { unlinked: true } })
  })

  it('does not revoke anything when the student is not linked', async () => {
    parentStudentRepository.exists.mockResolvedValue(false)

    await expect(useCase.execute(parent, 12)).rejects.toBeInstanceOf(NotFoundException)
    expect(revocation.revokeStudentAccess).not.toHaveBeenCalled()
  })

  it('rejects a non-parent identity', async () => {
    await expect(useCase.execute({ ...parent, userType: 'student', parentId: undefined }, 12)).rejects.toBeInstanceOf(
      ForbiddenException,
    )
    expect(parentStudentRepository.delete).not.toHaveBeenCalled()
  })
})
