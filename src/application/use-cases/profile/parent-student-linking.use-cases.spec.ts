import type { AuthenticatedUser } from '../../interfaces'
import { ParentStudentSummaryDto } from '../../dtos'
import { Parent } from '../../../domain/entities/user/parent.entity'
import { ParentStudent } from '../../../domain/entities/user/parent-student.entity'
import { Student } from '../../../domain/entities/user/student.entity'
import { User } from '../../../domain/entities/user/user.entity'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { ParentStudentSummaryService } from '../auth/parent'
import { GetAvailableParentStudentsUseCase } from './get-available-parent-students.use-case'
import { LinkParentStudentUseCase } from './link-parent-student.use-case'

function createUnitOfWork(repos: Partial<UnitOfWorkRepos>): IUnitOfWork {
  return {
    executeInTransaction: async <T>(work: (value: UnitOfWorkRepos) => Promise<T>) => work(repos as UnitOfWorkRepos),
  }
}

const parentIdentity: AuthenticatedUser = {
  userId: 20,
  username: '0392923661',
  userType: 'parent',
  parentId: 7,
  roles: [],
  permissions: [],
}

function createParent(): Parent {
  return new Parent({
    parentId: 7,
    userId: 20,
    phone: '0392923661',
    user: new User({
      userId: 20,
      username: '0392923661',
      passwordHash: 'hash',
      firstName: 'Lan',
      lastName: 'Nguyễn',
      isActive: true,
    }),
  })
}

function createStudent(studentId: number, isActive = true): Student {
  return new Student({
    studentId,
    userId: studentId + 100,
    grade: 6,
    parentPhone: '0392923661',
    user: new User({
      userId: studentId + 100,
      username: `student-${studentId}`,
      passwordHash: 'hash',
      firstName: `Học sinh ${studentId}`,
      lastName: 'Nguyễn',
      isActive,
    }),
  })
}

function createSummaryService(): ParentStudentSummaryService {
  return {
    createMany: async (students: Student[]) => students.map((student) => ParentStudentSummaryDto.fromStudent(student)),
  } as ParentStudentSummaryService
}

describe('Parent student linking use cases', () => {
  it('chỉ trả học sinh cùng số điện thoại chưa được liên kết', async () => {
    const linked = createStudent(12)
    const available = createStudent(18)
    const inactive = createStudent(21, false)
    const findByParentId = jest
      .fn()
      .mockResolvedValue([new ParentStudent({ parentId: 7, studentId: linked.studentId, student: linked })])
    const findAllByParentPhoneVariants = jest.fn().mockResolvedValue([linked, available, inactive])
    const useCase = new GetAvailableParentStudentsUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId: jest.fn().mockResolvedValue(createParent()),
        } as UnitOfWorkRepos['parentRepository'],
        parentStudentRepository: {
          findByParentId,
        } as UnitOfWorkRepos['parentStudentRepository'],
        studentRepository: {
          findAllByParentPhoneVariants,
        } as UnitOfWorkRepos['studentRepository'],
      }),
      createSummaryService(),
    )

    const result = await useCase.execute(parentIdentity)

    expect(findAllByParentPhoneVariants).toHaveBeenCalledWith(['0392923661', '84392923661', '+84392923661'])
    expect(result.data?.map((student) => student.studentId)).toEqual([18])
  })

  it('liên kết học sinh hợp lệ với Parent hiện tại', async () => {
    const student = createStudent(18)
    const createMany = jest.fn().mockResolvedValue([new ParentStudent({ parentId: 7, studentId: 18, student })])
    const findAllByIdsAndParentPhoneVariants = jest.fn().mockResolvedValue([student])
    const useCase = new LinkParentStudentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId: jest.fn().mockResolvedValue(createParent()),
        } as UnitOfWorkRepos['parentRepository'],
        parentStudentRepository: {
          exists: jest.fn().mockResolvedValue(false),
          createMany,
        } as UnitOfWorkRepos['parentStudentRepository'],
        studentRepository: {
          findAllByIdsAndParentPhoneVariants,
        } as UnitOfWorkRepos['studentRepository'],
      }),
      createSummaryService(),
    )

    const result = await useCase.execute(parentIdentity, 18)

    expect(findAllByIdsAndParentPhoneVariants).toHaveBeenCalledWith([18], ['0392923661', '84392923661', '+84392923661'])
    expect(createMany).toHaveBeenCalledWith([{ parentId: 7, studentId: 18 }])
    expect(result.data?.studentId).toBe(18)
  })

  it('từ chối khi học sinh đã được liên kết với Parent hiện tại', async () => {
    const findAllByIdsAndParentPhoneVariants = jest.fn()
    const createMany = jest.fn()
    const useCase = new LinkParentStudentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId: jest.fn().mockResolvedValue(createParent()),
        } as UnitOfWorkRepos['parentRepository'],
        parentStudentRepository: {
          exists: jest.fn().mockResolvedValue(true),
          createMany,
        } as UnitOfWorkRepos['parentStudentRepository'],
        studentRepository: {
          findAllByIdsAndParentPhoneVariants,
        } as UnitOfWorkRepos['studentRepository'],
      }),
      createSummaryService(),
    )

    await expect(useCase.execute(parentIdentity, 18)).rejects.toMatchObject({ status: 409 })
    expect(findAllByIdsAndParentPhoneVariants).not.toHaveBeenCalled()
    expect(createMany).not.toHaveBeenCalled()
  })

  it('từ chối học sinh không có parentPhone khớp Parent', async () => {
    const createMany = jest.fn()
    const useCase = new LinkParentStudentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId: jest.fn().mockResolvedValue(createParent()),
        } as UnitOfWorkRepos['parentRepository'],
        parentStudentRepository: {
          exists: jest.fn().mockResolvedValue(false),
          createMany,
        } as UnitOfWorkRepos['parentStudentRepository'],
        studentRepository: {
          findAllByIdsAndParentPhoneVariants: jest.fn().mockResolvedValue([]),
        } as UnitOfWorkRepos['studentRepository'],
      }),
      createSummaryService(),
    )

    await expect(useCase.execute(parentIdentity, 99)).rejects.toMatchObject({ status: 403 })
    expect(createMany).not.toHaveBeenCalled()
  })

  it('từ chối liên kết học sinh không hoạt động', async () => {
    const inactiveStudent = createStudent(18, false)
    const createMany = jest.fn()
    const useCase = new LinkParentStudentUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId: jest.fn().mockResolvedValue(createParent()),
        } as UnitOfWorkRepos['parentRepository'],
        parentStudentRepository: {
          exists: jest.fn().mockResolvedValue(false),
          createMany,
        } as UnitOfWorkRepos['parentStudentRepository'],
        studentRepository: {
          findAllByIdsAndParentPhoneVariants: jest.fn().mockResolvedValue([inactiveStudent]),
        } as UnitOfWorkRepos['studentRepository'],
      }),
      createSummaryService(),
    )

    await expect(useCase.execute(parentIdentity, 18)).rejects.toMatchObject({ status: 403 })
    expect(createMany).not.toHaveBeenCalled()
  })
})
