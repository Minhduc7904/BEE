import type { IUnitOfWork } from 'src/domain/repositories'
import { NotFoundException, ValidationException } from 'src/shared/exceptions/custom-exceptions'
import { GetCourseClassMakeupSessionsUseCase } from './get-course-class-makeup-sessions.use-case'

const session = (sessionId: number, classId: number, date: string) => ({
  sessionId,
  classId,
  name: `Buổi ${sessionId}`,
  sessionDate: new Date(`${date}T00:00:00.000Z`),
  startTime: new Date('1970-01-01T18:00:00.000Z'),
  endTime: new Date('1970-01-01T20:00:00.000Z'),
})

function setup(
  options: {
    source?: { classId: number; courseId: number } | null
    groups?: Array<{ groupId: number; memberClassIds: number[] }>
    sessions?: ReturnType<typeof session>[]
  } = {},
) {
  const source = options.source === undefined ? { classId: 10, courseId: 3 } : options.source
  const repos = {
    courseClassRepository: { findById: jest.fn().mockResolvedValue(source) },
    courseClassMakeupGroupRepository: {
      findGroupsByCourse: jest.fn().mockResolvedValue(options.groups ?? []),
      findClassesByCourse: jest.fn().mockResolvedValue([
        { classId: 10, className: 'Toán 10A' },
        { classId: 11, className: 'Toán 10B' },
      ]),
    },
    classSessionRepository: {
      findByClassIdsAndSessionDateRange: jest.fn().mockResolvedValue(options.sessions ?? []),
    },
  }
  const unitOfWork = { executeInTransaction: jest.fn((work: (r: typeof repos) => unknown) => work(repos)) }
  const useCase = new GetCourseClassMakeupSessionsUseCase(unitOfWork as unknown as IUnitOfWork)

  return { repos, unitOfWork, useCase }
}

describe('GetCourseClassMakeupSessionsUseCase', () => {
  it('weekStart không phải Thứ Hai: báo ValidationException, chưa mở transaction', async () => {
    const { unitOfWork, useCase } = setup()

    await expect(useCase.execute(10, '2026-10-13')).rejects.toBeInstanceOf(ValidationException)
    expect(unitOfWork.executeInTransaction).not.toHaveBeenCalled()
  })

  it('weekStart sai định dạng hoặc không có thật bị từ chối', async () => {
    const { useCase } = setup()

    await expect(useCase.execute(10, '12/10/2026')).rejects.toBeInstanceOf(ValidationException)
    await expect(useCase.execute(10, '2026-02-30')).rejects.toBeInstanceOf(ValidationException)
  })

  it('lớp nguồn không tồn tại: NotFoundException', async () => {
    const { useCase } = setup({ source: null })

    await expect(useCase.execute(10, '2026-10-12')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('lớp không thuộc nhóm nào: trả groupId null và không truy vấn buổi học', async () => {
    const { repos, useCase } = setup({ groups: [{ groupId: 7, memberClassIds: [20, 21] }] })

    const response = await useCase.execute(10, '2026-10-12')

    expect(response.data).toMatchObject({ groupId: null, sessions: [] })
    expect(repos.classSessionRepository.findByClassIdsAndSessionDateRange).not.toHaveBeenCalled()
  })

  it('nhóm chỉ còn một lớp (không hiệu lực) được coi như chưa có nhóm', async () => {
    const { repos, useCase } = setup({ groups: [{ groupId: 7, memberClassIds: [10] }] })

    const response = await useCase.execute(10, '2026-10-12')

    expect(response.data?.groupId).toBeNull()
    expect(repos.classSessionRepository.findByClassIdsAndSessionDateRange).not.toHaveBeenCalled()
  })

  it('truy vấn buổi của mọi lớp trong nhóm đúng trong khoảng Thứ Hai đến Chủ Nhật', async () => {
    const { repos, useCase } = setup({
      groups: [{ groupId: 5, memberClassIds: [10, 11] }],
      sessions: [session(1, 10, '2026-10-13'), session(2, 11, '2026-10-15')],
    })

    const response = await useCase.execute(10, '2026-10-12')

    expect(repos.classSessionRepository.findByClassIdsAndSessionDateRange).toHaveBeenCalledWith(
      [10, 11],
      new Date('2026-10-12T00:00:00.000Z'),
      new Date('2026-10-18T00:00:00.000Z'),
    )
    expect(response.data).toMatchObject({ groupId: 5, weekStart: '2026-10-12', weekEnd: '2026-10-18' })
    expect(response.data?.sessions).toHaveLength(1)
    expect(response.data?.sessions[0].makeupCandidates).toEqual([
      expect.objectContaining({ sessionId: 2, classId: 11, className: 'Toán 10B', sessionDate: '2026-10-15' }),
    ])
  })
})
