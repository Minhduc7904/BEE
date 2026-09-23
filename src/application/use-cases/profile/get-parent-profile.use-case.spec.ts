import type { AuthenticatedUser } from '../../interfaces'
import { Parent } from '../../../domain/entities/user/parent.entity'
import { ParentStudent } from '../../../domain/entities/user/parent-student.entity'
import { Student } from '../../../domain/entities/user/student.entity'
import { User } from '../../../domain/entities/user/user.entity'
import type { IUnitOfWork, UnitOfWorkRepos } from '../../../domain/repositories'
import { ParentStudentSummaryDto } from '../../dtos'
import { ParentStudentSummaryService } from '../auth/parent'
import { GetParentProfileUseCase } from './get-parent-profile.use-case'

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

describe('GetParentProfileUseCase', () => {
  it('trả Parent cùng toàn bộ học sinh liên kết theo thứ tự ổn định', async () => {
    const students = [15, 12, 18].map(
      (studentId) =>
        new Student({
          studentId,
          userId: studentId + 100,
          grade: 8,
          school: 'THCS BeeEdu',
          user: new User({
            userId: studentId + 100,
            username: `student-${studentId}`,
            passwordHash: 'hash',
            firstName: `Học sinh ${studentId}`,
            lastName: 'Nguyễn',
            isActive: studentId != 18,
          }),
        }),
    )
    const parent = new Parent({
      parentId: 7,
      userId: 20,
      phone: '0392923661',
      user: new User({
        userId: 20,
        username: '0392923661',
        passwordHash: 'hash',
        firstName: 'Lan',
        lastName: 'Nguyễn',
      }),
      studentLinks: students.map(
        (student) =>
          new ParentStudent({
            parentId: 7,
            studentId: student.studentId,
            student,
          }),
      ),
    })
    const findByUserId = jest.fn().mockResolvedValue(parent)
    const createMany = jest
      .fn<Promise<ParentStudentSummaryDto[]>, [Student[]]>()
      .mockImplementation(async (values) => values.map((student) => ParentStudentSummaryDto.fromStudent(student)))
    const useCase = new GetParentProfileUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId,
        } as UnitOfWorkRepos['parentRepository'],
      }),
      { createMany } as ParentStudentSummaryService,
    )

    const result = await useCase.execute(parentIdentity)

    expect(findByUserId).toHaveBeenCalledWith(20, {
      includeUser: true,
      includeStudents: true,
    })
    expect(createMany.mock.calls[0][0].map((student) => student.studentId)).toEqual([12, 15])
    expect(result.data?.parentId).toBe(7)
    expect(result.data?.students.map((student) => student.studentId)).toEqual([12, 15])
  })

  it('từ chối token không phải Parent trước khi truy vấn DB', async () => {
    const findByUserId = jest.fn()
    const useCase = new GetParentProfileUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId,
        } as UnitOfWorkRepos['parentRepository'],
      }),
      { createMany: jest.fn() } as unknown as ParentStudentSummaryService,
    )

    await expect(useCase.execute({ ...parentIdentity, userType: 'student' })).rejects.toMatchObject({ status: 403 })
    expect(findByUserId).not.toHaveBeenCalled()
  })

  it('từ chối khi parentId trong token không khớp hồ sơ', async () => {
    const parent = new Parent({
      parentId: 8,
      userId: 20,
      phone: '0392923661',
      user: new User({
        userId: 20,
        username: '0392923661',
        passwordHash: 'hash',
        firstName: 'Lan',
        lastName: 'Nguyễn',
      }),
    })
    const useCase = new GetParentProfileUseCase(
      createUnitOfWork({
        parentRepository: {
          findByUserId: jest.fn().mockResolvedValue(parent),
        } as UnitOfWorkRepos['parentRepository'],
      }),
      { createMany: jest.fn() } as unknown as ParentStudentSummaryService,
    )

    await expect(useCase.execute(parentIdentity)).rejects.toMatchObject({
      status: 403,
    })
  })
})
