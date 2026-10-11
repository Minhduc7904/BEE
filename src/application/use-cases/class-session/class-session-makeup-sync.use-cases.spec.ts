import type { IUnitOfWork } from 'src/domain/repositories'
import type { SessionMakeupRegistrationSyncService } from 'src/application/services/session-makeup-registration-sync.service'
import { CreateClassSessionDto } from 'src/application/dtos/class-session/create-class-session.dto'
import { UpdateClassSessionDto } from 'src/application/dtos/class-session/update-class-session.dto'
import { ClassSession } from 'src/domain/entities/class-session/class-session.entity'
import { CreateClassSessionUseCase } from './create-class-session.use-case'
import { UpdateClassSessionUseCase } from './update-class-session.use-case'

const sessionEntity = (sessionDate: string) =>
  new ClassSession({
    sessionId: 7,
    classId: 10,
    name: 'Buổi 7',
    sessionDate: new Date(`${sessionDate}T00:00:00.000Z`),
    startTime: new Date('1970-01-01T18:00:00.000Z'),
    endTime: new Date('1970-01-01T20:00:00.000Z'),
  })

function setup(options: { existingDate?: string; savedDate: string }) {
  const saved = sessionEntity(options.savedDate)
  const repos = {
    courseClassRepository: {
      findById: jest.fn().mockResolvedValue({ classId: 10, course: { isEnded: false } }),
    },
    classSessionRepository: {
      create: jest.fn().mockResolvedValue(saved),
      findById: jest.fn().mockResolvedValue(options.existingDate ? sessionEntity(options.existingDate) : null),
      update: jest.fn().mockResolvedValue(saved),
    },
    adminAuditLogRepository: { create: jest.fn() },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((work: (r: typeof repos) => unknown) => work(repos)),
  } as unknown as IUnitOfWork
  const sync = { syncForClasses: jest.fn().mockResolvedValue(undefined) }

  return {
    repos,
    sync,
    create: new CreateClassSessionUseCase(unitOfWork, sync as unknown as SessionMakeupRegistrationSyncService),
    update: new UpdateClassSessionUseCase(unitOfWork, sync as unknown as SessionMakeupRegistrationSyncService),
  }
}

describe('đồng bộ cặp buổi học bù khi tạo / sửa buổi học', () => {
  it('tạo buổi học: đồng bộ cho lớp của buổi trong đúng tuần của buổi', async () => {
    const { create, sync, repos } = setup({ savedDate: '2026-10-14' })
    const dto = Object.assign(new CreateClassSessionDto(), {
      classId: 10,
      sessionDate: '2026-10-14',
      startTime: '1970-01-01T18:00:00.000Z',
      endTime: '1970-01-01T20:00:00.000Z',
      name: 'Buổi 7',
    })

    await create.execute(dto, 1)

    expect(sync.syncForClasses).toHaveBeenCalledTimes(1)
    expect(sync.syncForClasses).toHaveBeenCalledWith(repos, {
      classIds: [10],
      range: { from: new Date('2026-10-14T00:00:00.000Z'), to: new Date('2026-10-14T00:00:00.000Z') },
    })
  })

  it('sửa buổi học sang tuần khác: đồng bộ cho cả ngày cũ lẫn ngày mới', async () => {
    const { update, sync, repos } = setup({ existingDate: '2026-10-14', savedDate: '2026-10-22' })

    await update.execute(7, Object.assign(new UpdateClassSessionDto(), { sessionDate: '2026-10-22' }), 1)

    expect(sync.syncForClasses).toHaveBeenCalledWith(repos, {
      classIds: [10],
      range: { from: new Date('2026-10-14T00:00:00.000Z'), to: new Date('2026-10-22T00:00:00.000Z') },
    })
  })

  it('chỉ đổi tên (không đổi ngày): không đồng bộ', async () => {
    const { update, sync } = setup({ existingDate: '2026-10-14', savedDate: '2026-10-14' })

    await update.execute(7, Object.assign(new UpdateClassSessionDto(), { name: 'Tên mới' }), 1)

    expect(sync.syncForClasses).not.toHaveBeenCalled()
  })

  it('buổi học không tồn tại khi sửa: không đồng bộ', async () => {
    const { update, sync } = setup({ savedDate: '2026-10-14' })

    await expect(update.execute(7, new UpdateClassSessionDto(), 1)).rejects.toThrow()
    expect(sync.syncForClasses).not.toHaveBeenCalled()
  })
})
