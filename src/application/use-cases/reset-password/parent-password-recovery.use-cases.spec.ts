import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { Parent, ParentStudent, ResetPasswordToken, Student, User } from '../../../domain/entities'
import { GetParentRecoveryStudentsUseCase } from './get-parent-recovery-students.use-case'
import { VerifyParentRecoveryUseCase } from './verify-parent-recovery.use-case'
import { ResetParentPasswordUseCase } from './reset-parent-password.use-case'
import { ParentStudentSummaryService } from '../auth/parent'

function unitOfWork(repos: Partial<UnitOfWorkRepos>): IUnitOfWork {
  return {
    executeInTransaction: (work) => work(repos as UnitOfWorkRepos),
  }
}

function noAvatarSummaryService(): ParentStudentSummaryService {
  return {
    findAvatarUrlsByUserIds: jest.fn().mockResolvedValue(new Map()),
  } as never
}

function linkedParent() {
  const parentUser = new User({
    userId: 1,
    username: '0392923661',
    passwordHash: 'hash',
    firstName: 'Phụ huynh',
    lastName: 'Nguyễn',
  })
  const studentUser = new User({
    userId: 2,
    username: 'student',
    passwordHash: 'hash',
    firstName: 'An',
    lastName: 'Nguyễn',
  })
  const student = new Student({
    studentId: 12,
    userId: 2,
    grade: 8,
    school: 'Trường A',
    studentPhone: '0901234567',
    parentPhone: '+84392923661',
    user: studentUser,
  })
  const parent = new Parent({
    parentId: 7,
    userId: 1,
    phone: '0392923661',
    user: parentUser,
    studentLinks: [new ParentStudent({ parentId: 7, studentId: 12, student })],
  })
  return { parent, student }
}

describe('Parent password recovery', () => {
  it('trả đúng bốn trường gồm trường thật', async () => {
    const { parent } = linkedParent()
    const useCase = new GetParentRecoveryStudentsUseCase(
      unitOfWork({
        parentRepository: { findByPhone: jest.fn().mockResolvedValue(parent) } as never,
        studentRepository: {
          findRandomDistinctSchools: jest.fn().mockResolvedValue(['Trường B', 'Trường C', 'Trường D', 'Trường E']),
        } as never,
      }),
      noAvatarSummaryService(),
    )

    const result = await useCase.execute({ phone: '0392923661' })

    expect(result.data?.students[0].schoolOptions).toHaveLength(4)
    expect(result.data?.students[0].schoolOptions).toContain('Trường A')
    expect(new Set(result.data?.students[0].schoolOptions).size).toBe(4)
  })

  it('chặn khi hồ sơ học sinh thiếu số điện thoại', async () => {
    const { parent, student } = linkedParent()
    student.studentPhone = undefined
    const useCase = new GetParentRecoveryStudentsUseCase(
      unitOfWork({
        parentRepository: { findByPhone: jest.fn().mockResolvedValue(parent) } as never,
      }),
      noAvatarSummaryService(),
    )

    await expect(useCase.execute({ phone: '0392923661' })).rejects.toMatchObject({ status: 400 })
  })

  it('chặn khi không đủ ba trường mồi khác nhau', async () => {
    const { parent } = linkedParent()
    const useCase = new GetParentRecoveryStudentsUseCase(
      unitOfWork({
        parentRepository: { findByPhone: jest.fn().mockResolvedValue(parent) } as never,
        studentRepository: {
          findRandomDistinctSchools: jest.fn().mockResolvedValue(['Trường B', 'Trường B', 'Trường C']),
        } as never,
      }),
      noAvatarSummaryService(),
    )

    await expect(useCase.execute({ phone: '0392923661' })).rejects.toMatchObject({ status: 400 })
  })

  it.each([
    ['thiếu', []],
    [
      'dư',
      [
        { studentId: 12, school: 'Trường A', studentPhone: '0901234567', parentPhone: '0392923661' },
        { studentId: 99, school: 'Trường B', studentPhone: '0901234567', parentPhone: '0392923661' },
      ],
    ],
    [
      'trùng',
      [
        { studentId: 12, school: 'Trường A', studentPhone: '0901234567', parentPhone: '0392923661' },
        { studentId: 12, school: 'Trường A', studentPhone: '0901234567', parentPhone: '0392923661' },
      ],
    ],
  ])('từ chối danh sách học sinh %s', async (_case, students) => {
    const { parent } = linkedParent()
    const useCase = new VerifyParentRecoveryUseCase(
      unitOfWork({
        parentRepository: { findByPhone: jest.fn().mockResolvedValue(parent) } as never,
      }),
      {} as never,
    )

    await expect(useCase.execute({ phone: '0392923661', students })).rejects.toMatchObject({ status: 400 })
  })

  it('đánh dấu đúng học sinh sai và không tạo token', async () => {
    const { parent } = linkedParent()
    const createToken = jest.fn()
    const useCase = new VerifyParentRecoveryUseCase(
      unitOfWork({
        parentRepository: { findByPhone: jest.fn().mockResolvedValue(parent) } as never,
        passwordResetTokenRepository: { create: createToken } as never,
      }),
      {} as never,
    )

    const result = await useCase.execute({
      phone: '0392923661',
      students: [
        {
          studentId: 12,
          school: 'Trường sai',
          studentPhone: '0901234567',
          parentPhone: '0392923661',
        },
      ],
    })

    expect(result.data).toEqual({ verified: false, invalidStudentIds: [12] })
    expect(createToken).not.toHaveBeenCalled()
  })

  it('tạo reset token sau khi mọi thông tin đều đúng', async () => {
    const { parent } = linkedParent()
    const createToken = jest.fn().mockResolvedValue(undefined)
    const useCase = new VerifyParentRecoveryUseCase(
      unitOfWork({
        parentRepository: { findByPhone: jest.fn().mockResolvedValue(parent) } as never,
        passwordResetTokenRepository: { create: createToken } as never,
      }),
      {
        generateToken: jest.fn().mockReturnValue({ rawToken: 'raw', tokenHash: 'hashed' }),
        generateExpiryTime: jest.fn().mockReturnValue(new Date('2030-01-01T00:00:00Z')),
      } as never,
    )

    const result = await useCase.execute({
      phone: '0392923661',
      students: [
        {
          studentId: 12,
          school: 'Trường A',
          studentPhone: '0901234567',
          parentPhone: '0392923661',
        },
      ],
    })

    expect(result.data?.verified).toBe(true)
    expect(result.data?.resetToken).toBe('raw')
    expect(createToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, tokenHash: 'hashed' }))
  })

  it('đổi mật khẩu, consume token và thu hồi toàn bộ phiên trong transaction', async () => {
    const { parent } = linkedParent()
    const update = jest.fn().mockResolvedValue(parent.user)
    const revoke = jest.fn().mockResolvedValue(2)
    const consume = jest.fn().mockResolvedValue(true)
    const token = new ResetPasswordToken({
      id: 4,
      userId: 1,
      tokenHash: 'hashed',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    })
    const useCase = new ResetParentPasswordUseCase(
      unitOfWork({
        passwordResetTokenRepository: {
          findByTokenHash: jest.fn().mockResolvedValue(token),
          markAsUsedIfUsable: consume,
        } as never,
        parentRepository: { findByUserId: jest.fn().mockResolvedValue(parent) } as never,
        userRepository: { update } as never,
        userRefreshTokenRepository: { revokeAllUserTokens: revoke } as never,
      }),
      { hashToken: jest.fn().mockReturnValue('hashed') } as never,
      { hashPassword: jest.fn().mockResolvedValue('new-hash') },
    )

    const result = await useCase.execute({
      token: 'raw',
      newPassword: 'Example123',
      confirmPassword: 'Example123',
    })

    expect(result.data).toEqual({ changed: true })
    expect(consume).toHaveBeenCalledWith(4, expect.any(Date))
    expect(update).toHaveBeenCalledWith(1, { passwordHash: 'new-hash' })
    expect(revoke).toHaveBeenCalledWith(1)
  })

  it('từ chối token hết hạn trước khi thay đổi mật khẩu', async () => {
    const token = new ResetPasswordToken({
      id: 4,
      userId: 1,
      tokenHash: 'hashed',
      expiresAt: new Date(Date.now() - 60_000),
      createdAt: new Date(Date.now() - 120_000),
    })
    const update = jest.fn()
    const useCase = new ResetParentPasswordUseCase(
      unitOfWork({
        passwordResetTokenRepository: { findByTokenHash: jest.fn().mockResolvedValue(token) } as never,
        userRepository: { update } as never,
      }),
      { hashToken: jest.fn().mockReturnValue('hashed') } as never,
      { hashPassword: jest.fn().mockResolvedValue('new-hash') },
    )

    await expect(
      useCase.execute({ token: 'raw', newPassword: 'Example123', confirmPassword: 'Example123' }),
    ).rejects.toMatchObject({ status: 400 })
    expect(update).not.toHaveBeenCalled()
  })

  it('từ chối token không thuộc Parent hợp lệ', async () => {
    const token = new ResetPasswordToken({
      id: 4,
      userId: 1,
      tokenHash: 'hashed',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    })
    const consume = jest.fn()
    const useCase = new ResetParentPasswordUseCase(
      unitOfWork({
        passwordResetTokenRepository: {
          findByTokenHash: jest.fn().mockResolvedValue(token),
          markAsUsedIfUsable: consume,
        } as never,
        parentRepository: { findByUserId: jest.fn().mockResolvedValue(null) } as never,
      }),
      { hashToken: jest.fn().mockReturnValue('hashed') } as never,
      { hashPassword: jest.fn().mockResolvedValue('new-hash') },
    )

    await expect(
      useCase.execute({ token: 'raw', newPassword: 'Example123', confirmPassword: 'Example123' }),
    ).rejects.toMatchObject({ status: 404 })
    expect(consume).not.toHaveBeenCalled()
  })

  it('chỉ một trong hai request có thể consume cùng token', async () => {
    const { parent } = linkedParent()
    const token = new ResetPasswordToken({
      id: 4,
      userId: 1,
      tokenHash: 'hashed',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    })
    const consume = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const update = jest.fn().mockResolvedValue(parent.user)
    const useCase = new ResetParentPasswordUseCase(
      unitOfWork({
        passwordResetTokenRepository: {
          findByTokenHash: jest.fn().mockResolvedValue(token),
          markAsUsedIfUsable: consume,
        } as never,
        parentRepository: { findByUserId: jest.fn().mockResolvedValue(parent) } as never,
        userRepository: { update } as never,
        userRefreshTokenRepository: { revokeAllUserTokens: jest.fn() } as never,
      }),
      { hashToken: jest.fn().mockReturnValue('hashed') } as never,
      { hashPassword: jest.fn().mockResolvedValue('new-hash') },
    )
    const command = { token: 'raw', newPassword: 'Example123', confirmPassword: 'Example123' }

    const results = await Promise.allSettled([useCase.execute(command), useCase.execute(command)])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(update).toHaveBeenCalledTimes(1)
  })
})
