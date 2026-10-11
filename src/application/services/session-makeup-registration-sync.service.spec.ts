import { SessionMakeupRegistrationSyncService } from './session-makeup-registration-sync.service'

const session = (sessionId: number, classId: number, date: string) => ({
  sessionId,
  classId,
  sessionDate: new Date(`${date}T00:00:00.000Z`),
})

function setup(options: {
  classes?: Array<{ classId: number; courseId: number }>
  groups?: Array<{ groupId: number; memberClassIds: number[] }>
  sessions?: ReturnType<typeof session>[]
}) {
  const calls: string[] = []
  const repos = {
    courseClassRepository: {
      findByIds: jest.fn((ids: number[]) =>
        Promise.resolve((options.classes ?? []).filter((courseClass) => ids.includes(courseClass.classId))),
      ),
    },
    courseClassMakeupGroupRepository: {
      findGroupsByCourse: jest.fn(() => Promise.resolve(options.groups ?? [])),
    },
    classSessionRepository: {
      findByClassIds: jest.fn((_classIds: number[], _range?: { from: Date; to: Date }) =>
        Promise.resolve(options.sessions ?? []),
      ),
    },
    sessionMakeupRegistrationRepository: {
      deleteTouchingSessionIds: jest.fn((_ids: number[]) => {
        calls.push('delete')
        return Promise.resolve()
      }),
      createMany: jest.fn((_pairs: Array<{ sessionId: number; makeupSessionId: number }>) => {
        calls.push('create')
        return Promise.resolve()
      }),
    },
  }

  return { repos, calls, service: new SessionMakeupRegistrationSyncService() }
}

const courseClasses = [
  { classId: 10, courseId: 1 },
  { classId: 11, courseId: 1 },
  { classId: 12, courseId: 1 },
]

describe('SessionMakeupRegistrationSyncService', () => {
  it('xóa cặp cũ chạm các buổi rồi tạo lại đúng tập cặp theo nhóm hiện tại', async () => {
    const { repos, calls, service } = setup({
      classes: courseClasses,
      groups: [{ groupId: 5, memberClassIds: [10, 11] }],
      sessions: [session(1, 10, '2026-10-13'), session(2, 11, '2026-10-15')],
    })

    await service.syncForClasses(repos as never, { classIds: [10] })

    expect(repos.sessionMakeupRegistrationRepository.deleteTouchingSessionIds).toHaveBeenCalledWith([1, 2])
    expect(repos.sessionMakeupRegistrationRepository.createMany).toHaveBeenCalledWith([
      { sessionId: 1, makeupSessionId: 2 },
      { sessionId: 2, makeupSessionId: 1 },
    ])
    expect(calls).toEqual(['delete', 'create'])
  })

  it('mở rộng sang mọi lớp cùng nhóm với lớp bị ảnh hưởng', async () => {
    const { repos, service } = setup({
      classes: courseClasses,
      groups: [{ groupId: 5, memberClassIds: [10, 11, 12] }],
    })

    await service.syncForClasses(repos as never, { classIds: [11] })

    const [classIds] = repos.classSessionRepository.findByClassIds.mock.calls[0]
    expect([...classIds].sort((a, b) => a - b)).toEqual([10, 11, 12])
  })

  it('range được mở rộng thành trọn tuần Thứ Hai đến Chủ Nhật', async () => {
    const { repos, service } = setup({ classes: courseClasses, groups: [{ groupId: 5, memberClassIds: [10, 11] }] })

    await service.syncForClasses(repos as never, {
      classIds: [10],
      range: { from: new Date('2026-10-14T00:00:00.000Z'), to: new Date('2026-10-22T00:00:00.000Z') },
    })

    const [, range] = repos.classSessionRepository.findByClassIds.mock.calls[0]
    expect(range?.from.toISOString()).toBe('2026-10-12T00:00:00.000Z')
    expect(range?.to.toISOString()).toBe('2026-10-25T00:00:00.000Z')
  })

  it('không truyền range thì lấy mọi buổi của các lớp', async () => {
    const { repos, service } = setup({ classes: courseClasses, groups: [] })

    await service.syncForClasses(repos as never, { classIds: [10] })

    expect(repos.classSessionRepository.findByClassIds).toHaveBeenCalledWith([10], undefined)
  })

  it('lớp rời nhóm hoặc nhóm bị giải tán: cặp cũ bị xóa và không tạo cặp mới', async () => {
    const { repos, service } = setup({
      classes: courseClasses,
      groups: [],
      sessions: [session(1, 10, '2026-10-13'), session(2, 11, '2026-10-15')],
    })

    await service.syncForClasses(repos as never, { classIds: [10, 11] })

    expect(repos.sessionMakeupRegistrationRepository.deleteTouchingSessionIds).toHaveBeenCalledWith([1, 2])
    expect(repos.sessionMakeupRegistrationRepository.createMany).toHaveBeenCalledWith([])
  })

  it('nhóm chỉ còn một lớp (không hiệu lực) không tạo cặp', async () => {
    const { repos, service } = setup({
      classes: courseClasses,
      groups: [{ groupId: 5, memberClassIds: [10] }],
      sessions: [session(1, 10, '2026-10-13')],
    })

    await service.syncForClasses(repos as never, { classIds: [10] })

    expect(repos.sessionMakeupRegistrationRepository.createMany).toHaveBeenCalledWith([])
  })

  it('không có lớp nào thì không đụng tới repository', async () => {
    const { repos, service } = setup({})

    await service.syncForClasses(repos as never, { classIds: [] })

    expect(repos.courseClassRepository.findByIds).not.toHaveBeenCalled()
    expect(repos.sessionMakeupRegistrationRepository.deleteTouchingSessionIds).not.toHaveBeenCalled()
  })
})
