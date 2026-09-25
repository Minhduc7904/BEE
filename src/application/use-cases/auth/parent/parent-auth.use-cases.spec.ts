import { HttpException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../../domain/repositories'
import { User } from '../../../../domain/entities/user/user.entity'
import { Parent } from '../../../../domain/entities/user/parent.entity'
import { ParentStudent } from '../../../../domain/entities/user/parent-student.entity'
import { Student } from '../../../../domain/entities/user/student.entity'
import { UserRefreshToken } from '../../../../domain/entities/token/user-refresh-token.entity'
import { LoginParentRequestDto } from '../../../dtos'
import { RefreshTokenUseCase } from '../refresh-token.use-case'
import { CheckParentPhoneUseCase } from './check-parent-phone.use-case'
import { LoginParentUseCase } from './login-parent.use-case'
import { RegisterParentUseCase } from './register-parent.use-case'

function createUnitOfWork(repos: Partial<UnitOfWorkRepos>): IUnitOfWork {
  return {
    executeInTransaction: async <T>(work: (value: UnitOfWorkRepos) => Promise<T>) => work(repos as UnitOfWorkRepos),
  }
}

describe('Parent authentication', () => {
  it.each(['+84392923661', '84392923661'])('từ chối định dạng số %s', async (phone) => {
    const dto = plainToInstance(LoginParentRequestDto, {
      phone,
      password: 'Example123',
    })

    const errors = await validate(dto)

    expect(errors.some((error) => error.property === 'phone')).toBe(true)
  })

  it('chấp nhận số nội địa 10 chữ số bắt đầu bằng 0', async () => {
    const dto = plainToInstance(LoginParentRequestDto, {
      phone: '0392923661',
      password: 'Example123',
    })

    expect(await validate(dto)).toHaveLength(0)
  })

  it('check phone cho phép đăng nhập khi Parent đã tồn tại', async () => {
    const useCase = new CheckParentPhoneUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(new Parent({ parentId: 1, userId: 2, phone: '0392923661' })),
        } as UnitOfWorkRepos['parentRepository'],
      }),
    )

    const result = await useCase.execute({ phone: '0392923661' })

    expect(result.data).toEqual({ canLogin: true, canRegister: false, students: [] })
  })

  it('check phone trả danh sách học sinh tối thiểu khi được đăng ký', async () => {
    const student = new Student({
      studentId: 12,
      userId: 20,
      grade: 8,
      user: new User({
        userId: 20,
        username: 'student-12',
        passwordHash: 'hash',
        firstName: 'Minh An',
        lastName: 'Nguyễn',
      }),
    })
    const useCase = new CheckParentPhoneUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(null),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          existsByUsername: jest.fn().mockResolvedValue(false),
        } as UnitOfWorkRepos['userRepository'],
        studentRepository: {
          findAllByParentPhoneVariants: jest.fn().mockResolvedValue([student]),
        } as UnitOfWorkRepos['studentRepository'],
      }),
    )

    const result = await useCase.execute({ phone: '0392923661' })

    expect(result.data).toEqual({
      canLogin: false,
      canRegister: true,
      students: [
        {
          studentId: 12,
          fullName: 'Nguyễn Minh An',
          grade: 8,
          school: undefined,
          avatarUrl: null,
          gender: null,
        },
      ],
    })
  })

  it('check phone trả 409 khi username thuộc loại tài khoản khác', async () => {
    const useCase = new CheckParentPhoneUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(null),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          existsByUsername: jest.fn().mockResolvedValue(true),
        } as UnitOfWorkRepos['userRepository'],
      }),
    )

    await expect(useCase.execute({ phone: '0392923661' })).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpException>)
  })

  it('login tạo JWT Parent có parentId và lưu refresh token', async () => {
    const user = new User({
      userId: 2,
      username: '0392923661',
      passwordHash: 'hash',
      firstName: 'An',
      lastName: 'Nguyễn',
    })
    const parent = new Parent({
      parentId: 7,
      userId: 2,
      phone: '0392923661',
      user,
      studentLinks: [],
    })
    const generateAccessToken = jest.fn().mockReturnValue('access')
    const generateRefreshToken = jest.fn().mockReturnValue('refresh')
    const createRefreshToken = jest.fn().mockResolvedValue(undefined)
    const deleteOtherDevices = jest.fn().mockResolvedValue(1)
    const useCase = new LoginParentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(parent),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          update: jest.fn().mockResolvedValue(user),
        } as UnitOfWorkRepos['userRepository'],
        userRefreshTokenRepository: {
          revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
          create: createRefreshToken,
        } as UnitOfWorkRepos['userRefreshTokenRepository'],
        userDeviceRepository: {
          deleteByUserIdExceptDevice: deleteOtherDevices,
        } as unknown as UnitOfWorkRepos['userDeviceRepository'],
        userNotificationSettingRepository: {
          findByUserId: jest.fn().mockResolvedValue(null),
        } as unknown as UnitOfWorkRepos['userNotificationSettingRepository'],
        parentNotificationSettingRepository: {
          findByParentId: jest.fn().mockResolvedValue(null),
        } as unknown as UnitOfWorkRepos['parentNotificationSettingRepository'],
      }),
      { comparePassword: jest.fn().mockResolvedValue(true) },
      {
        generateAccessToken,
        generateRefreshToken,
        getAccessTokenExpirationTime: jest.fn().mockReturnValue(3600),
      },
      { hashToken: jest.fn().mockResolvedValue('refresh-hash') },
    )

    const result = await useCase.execute({ phone: '0392923661', password: 'Example123', deviceId: 'device-a' })

    // Đăng nhập gỡ mọi thiết bị khác, chỉ giữ thiết bị vừa gửi deviceId.
    expect(deleteOtherDevices).toHaveBeenCalledWith(2, 'device-a')
    expect((result.data?.user as { notificationSettings?: { isEnabled: boolean | null } }).notificationSettings).toEqual(
      expect.objectContaining({ isEnabled: null }),
    )
    expect(generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({ userType: 'parent', parentId: 7 }))
    expect(createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 2, tokenHash: 'refresh-hash' }))
    expect(result.data?.tokens).toEqual({ accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600 })
  })

  it('register tạo User, Parent và các liên kết đã chọn trong một transaction', async () => {
    const students = [12, 15].map(
      (studentId) =>
        new Student({
          studentId,
          userId: studentId + 100,
          grade: 8,
          parentPhone: '0392923661',
        }),
    )
    const user = new User({
      userId: 20,
      username: '0392923661',
      passwordHash: 'hash',
      firstName: 'An',
      lastName: 'Nguyễn',
    })
    const createdParent = new Parent({
      parentId: 5,
      userId: 20,
      phone: '0392923661',
      user,
      studentLinks: students.map(
        (student) =>
          new ParentStudent({
            parentId: 5,
            studentId: student.studentId,
            student,
          }),
      ),
    })
    const createLinks = jest.fn().mockResolvedValue([])
    const useCase = new RegisterParentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue(createdParent),
          findById: jest.fn().mockResolvedValue(createdParent),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          existsByUsername: jest.fn().mockResolvedValue(false),
          create: jest.fn().mockResolvedValue(user),
        } as UnitOfWorkRepos['userRepository'],
        studentRepository: {
          findAllByIdsAndParentPhoneVariants: jest.fn().mockResolvedValue(students),
        } as UnitOfWorkRepos['studentRepository'],
        parentStudentRepository: {
          createMany: createLinks,
        } as UnitOfWorkRepos['parentStudentRepository'],
      }),
      { hashPassword: jest.fn().mockResolvedValue('hash') },
    )

    const result = await useCase.execute({
      phone: '0392923661',
      password: 'Example123',
      firstName: 'An',
      lastName: 'Nguyễn',
      studentIds: [12, 15],
    })

    expect(createLinks).toHaveBeenCalledWith([
      { parentId: 5, studentId: 12 },
      { parentId: 5, studentId: 15 },
    ])
    expect(result.data?.parentId).toBe(5)
  })

  it('register kiểm tra lại và từ chối khi Parent đã được tạo sau bước check-phone', async () => {
    const phone = '0392923661'
    const password = 'Example123'
    const studentIds = [12]
    const firstName = 'An'
    const lastName = 'Nguyễn'
    const existingParent = new Parent({ parentId: 5, userId: 20, phone })
    const createUser = jest.fn()
    const useCase = new RegisterParentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(existingParent),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          create: createUser,
        } as UnitOfWorkRepos['userRepository'],
      }),
      { hashPassword: jest.fn() },
    )

    await expect(useCase.execute({ phone, password, firstName, lastName, studentIds })).rejects.toMatchObject({
      status: 409,
    })
    expect(createUser).not.toHaveBeenCalled()
  })

  it('register kiểm tra lại và từ chối khi username đã được dùng sau bước check-phone', async () => {
    const phone = '0392923661'
    const createUser = jest.fn()
    const useCase = new RegisterParentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(null),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          existsByUsername: jest.fn().mockResolvedValue(true),
          create: createUser,
        } as UnitOfWorkRepos['userRepository'],
      }),
      { hashPassword: jest.fn() },
    )

    await expect(
      useCase.execute({
        phone,
        password: 'Example123',
        firstName: 'An',
        lastName: 'Nguyễn',
        studentIds: [12],
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(createUser).not.toHaveBeenCalled()
  })

  it('register từ chối toàn bộ khi một studentId không thuộc số điện thoại', async () => {
    const createUser = jest.fn()
    const useCase = new RegisterParentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByPhone: jest.fn().mockResolvedValue(null),
        } as UnitOfWorkRepos['parentRepository'],
        userRepository: {
          existsByUsername: jest.fn().mockResolvedValue(false),
          create: createUser,
        } as UnitOfWorkRepos['userRepository'],
        studentRepository: {
          findAllByIdsAndParentPhoneVariants: jest
            .fn()
            .mockResolvedValue([new Student({ studentId: 12, userId: 112, grade: 8 })]),
        } as UnitOfWorkRepos['studentRepository'],
      }),
      { hashPassword: jest.fn() },
    )

    await expect(
      useCase.execute({
        phone: '0392923661',
        password: 'Example123',
        firstName: 'An',
        lastName: 'Nguyễn',
        studentIds: [12, 15],
      }),
    ).rejects.toMatchObject({ status: 400 })
    expect(createUser).not.toHaveBeenCalled()
  })

  it('refresh Parent bảo toàn userType và parentId', async () => {
    const oldToken = new UserRefreshToken({
      tokenId: 1,
      userId: 2,
      familyId: 'family',
      tokenHash: 'old-hash',
      expiresAt: new Date(Date.now() + 60_000),
    })
    const newToken = new UserRefreshToken({
      tokenId: 2,
      userId: 2,
      familyId: 'family',
      tokenHash: 'new-hash',
      expiresAt: new Date(Date.now() + 60_000),
    })
    const generateAccessToken = jest.fn().mockReturnValue('new-access')
    const generateRefreshToken = jest.fn().mockReturnValue('new-refresh')
    const useCase = new RefreshTokenUseCase(
      createUnitOfWork({
        userRefreshTokenRepository: {
          findByUserId: jest.fn().mockResolvedValue([oldToken]),
          create: jest.fn().mockResolvedValue(newToken),
          revokeTokenWithReplacement: jest.fn().mockResolvedValue(true),
          updateLastUsed: jest.fn().mockResolvedValue(undefined),
        } as UnitOfWorkRepos['userRefreshTokenRepository'],
        userRepository: {
          findById: jest.fn().mockResolvedValue(
            new User({
              userId: 2,
              username: '0392923661',
              passwordHash: 'hash',
              firstName: 'An',
              lastName: 'Nguyễn',
            }),
          ),
        } as UnitOfWorkRepos['userRepository'],
      }),
      {
        verifyRefreshToken: jest.fn().mockReturnValue({
          sub: 2,
          username: '0392923661',
          userType: 'parent',
          parentId: 7,
        }),
        generateAccessToken,
        generateRefreshToken,
        getAccessTokenExpirationTime: jest.fn().mockReturnValue(3600),
      },
      {
        verifyToken: jest.fn().mockResolvedValue(true),
        hashToken: jest.fn().mockResolvedValue('new-hash'),
      },
    )

    await useCase.execute({ refreshToken: 'old-refresh' })

    expect(generateAccessToken).toHaveBeenCalledWith(expect.objectContaining({ userType: 'parent', parentId: 7 }))
  })
})
