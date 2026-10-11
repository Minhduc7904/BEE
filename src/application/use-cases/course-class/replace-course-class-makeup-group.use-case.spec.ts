import type { IUnitOfWork } from '../../../domain/repositories'
import { CourseClass } from '../../../domain/entities/course-class/course-class.entity'
import {
  COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE,
  type CourseClassMakeupCandidate,
  type MakeupGroup,
} from '../../../domain/interface/course-class/course-class-makeup-group.interface'
import { ReplaceCourseClassMakeupGroupDto } from '../../dtos/course-class/replace-course-class-makeup-group.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import {
  BusinessLogicException,
  ConflictException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import { ReplaceCourseClassMakeupGroupUseCase } from './replace-course-class-makeup-group.use-case'

const COURSE_ID = 20
const ADMIN_ID = 7
const NEW_GROUP_ID = 99

function courseClass(classId: number, overrides: Partial<ConstructorParameters<typeof CourseClass>[0]> = {}) {
  return new CourseClass({ classId, courseId: COURSE_ID, className: `Lớp ${classId}`, ...overrides })
}

function candidate(classId: number): CourseClassMakeupCandidate {
  return {
    classId,
    className: `Lớp ${classId}`,
    weeklySchedule: null,
    startDate: null,
    endDate: null,
    room: null,
    instructorName: null,
  }
}

function group(groupId: number, memberClassIds: number[]): MakeupGroup {
  return { groupId, memberClassIds }
}

function dto(makeupClassIds: number[]): ReplaceCourseClassMakeupGroupDto {
  const body = new ReplaceCourseClassMakeupGroupDto()
  body.makeupClassIds = makeupClassIds
  return body
}

function setup(params: { classes?: CourseClass[]; groups?: MakeupGroup[] } = {}) {
  const classes = params.classes ?? [courseClass(1), courseClass(2), courseClass(3), courseClass(4), courseClass(5)]
  const groups = params.groups ?? []
  const calls: string[] = []

  function recorded<TArgs extends unknown[], TResult>(name: string, resolve: (...args: TArgs) => TResult) {
    return jest.fn((...args: TArgs) => {
      calls.push(name)
      return Promise.resolve(resolve(...args))
    })
  }

  const courseClassRepository = {
    findById: recorded('findSource', (id: number) => classes.find((item) => item.classId === id) ?? null),
    findByIds: recorded('findTargets', (ids: number[]) => classes.filter((item) => ids.includes(item.classId))),
  }
  const courseClassMakeupGroupRepository = {
    lockCourse: recorded('lock', () => undefined),
    findClassesByCourse: recorded('classes', () => classes.map((item) => candidate(item.classId))),
    findGroupsByCourse: recorded('groups', () => groups),
    saveGroup: recorded('save', (saved: { groupId: number | null }) => saved.groupId ?? NEW_GROUP_ID),
    dissolveGroup: recorded('dissolve', () => undefined),
  }
  const adminAuditLogRepository = {
    create: recorded('audit', () => undefined),
  }
  const repos = { courseClassRepository, courseClassMakeupGroupRepository, adminAuditLogRepository }
  const executeInTransaction = jest.fn((work: (value: typeof repos) => Promise<unknown>) => work(repos))
  const unitOfWork = { executeInTransaction } as unknown as IUnitOfWork

  return {
    useCase: new ReplaceCourseClassMakeupGroupUseCase(unitOfWork),
    calls,
    executeInTransaction,
    ...repos,
  }
}

describe('ReplaceCourseClassMakeupGroupUseCase', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-04T03:00:00.000Z') })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  async function expectRejected(
    scenario: ReturnType<typeof setup>,
    classId: number,
    ids: number[],
    errorType: new (...args: never[]) => Error,
  ) {
    await expect(scenario.useCase.execute(classId, dto(ids), ADMIN_ID)).rejects.toBeInstanceOf(errorType)
    expect(scenario.courseClassMakeupGroupRepository.saveGroup).not.toHaveBeenCalled()
    expect(scenario.courseClassMakeupGroupRepository.dissolveGroup).not.toHaveBeenCalled()
    expect(scenario.adminAuditLogRepository.create).not.toHaveBeenCalled()
  }

  describe('validation', () => {
    it('trả 404 khi lớp nguồn không tồn tại', async () => {
      const scenario = setup()
      await expectRejected(scenario, 999, [2], NotFoundException)
      expect(scenario.courseClassRepository.findByIds).not.toHaveBeenCalled()
    })

    it('từ chối ID trùng trong request', async () => {
      const scenario = setup()
      await expectRejected(scenario, 1, [2, 2], BusinessLogicException)
      expect(scenario.courseClassRepository.findByIds).not.toHaveBeenCalled()
    })

    it('từ chối lớp nguồn nằm trong danh sách', async () => {
      const scenario = setup()
      await expectRejected(scenario, 1, [1, 2], BusinessLogicException)
      expect(scenario.courseClassRepository.findByIds).not.toHaveBeenCalled()
    })

    it('đọc toàn bộ lớp đích bằng đúng một query', async () => {
      const scenario = setup()
      await scenario.useCase.execute(1, dto([2, 3, 4]), ADMIN_ID)
      expect(scenario.courseClassRepository.findByIds).toHaveBeenCalledTimes(1)
      expect(scenario.courseClassRepository.findByIds).toHaveBeenCalledWith([2, 3, 4])
    })

    it('trả 404 khi có lớp không tồn tại và nêu rõ ID thiếu', async () => {
      const scenario = setup()
      await expect(scenario.useCase.execute(1, dto([2, 77, 88]), ADMIN_ID)).rejects.toThrow('77, 88')
      expect(scenario.courseClassMakeupGroupRepository.saveGroup).not.toHaveBeenCalled()
    })

    it('từ chối lớp khác khóa học', async () => {
      const scenario = setup({ classes: [courseClass(1), courseClass(2, { courseId: 99 })] })
      await expectRejected(scenario, 1, [2], BusinessLogicException)
    })

    it('từ chối thêm mới lớp đã kết thúc theo ngày Việt Nam', async () => {
      const scenario = setup({
        classes: [courseClass(1), courseClass(2, { endDate: new Date('2026-10-03T00:00:00.000Z') })],
      })
      await expectRejected(scenario, 1, [2], BusinessLogicException)
    })

    it('cho phép thêm lớp có endDate đúng hôm nay', async () => {
      const scenario = setup({
        classes: [courseClass(1), courseClass(2, { endDate: new Date('2026-10-04T00:00:00.000Z') })],
      })
      await scenario.useCase.execute(1, dto([2]), ADMIN_ID)
      expect(scenario.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledTimes(1)
    })
  })

  describe('một lớp chỉ thuộc một nhóm', () => {
    it('từ chối lớp đang ở nhóm học bù khác (409 kèm mã lỗi) và không ghi gì', async () => {
      const scenario = setup({ groups: [group(8, [3, 4])] })

      const failure = scenario.useCase.execute(1, dto([2, 3]), ADMIN_ID)

      await expect(failure).rejects.toBeInstanceOf(ConflictException)
      await expect(failure).rejects.toMatchObject({ code: COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE })
      await expect(failure).rejects.toThrow('Lớp 3')
      expect(scenario.courseClassMakeupGroupRepository.saveGroup).not.toHaveBeenCalled()
      expect(scenario.adminAuditLogRepository.create).not.toHaveBeenCalled()
    })

    it('cho phép lớp đang ở nhóm mồ côi chỉ còn một lớp', async () => {
      const scenario = setup({ groups: [group(8, [3])] })

      await scenario.useCase.execute(1, dto([3]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledWith({
        groupId: null,
        addClassIds: [1, 3],
        removeClassIds: [],
      })
    })

    it('lớp đã cùng nhóm với lớp nguồn không bị coi là nhóm khác', async () => {
      const scenario = setup({ groups: [group(5, [1, 2])] })

      await scenario.useCase.execute(1, dto([2, 3]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledWith({
        groupId: 5,
        addClassIds: [3],
        removeClassIds: [],
      })
    })
  })

  describe('lưu nhóm', () => {
    it('tạo nhóm mới gồm lớp nguồn và các lớp được chọn khi lớp nguồn chưa có nhóm', async () => {
      const scenario = setup()

      const response = await scenario.useCase.execute(1, dto([2, 3]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledWith({
        groupId: null,
        addClassIds: [1, 2, 3],
        removeClassIds: [],
      })
      expect(response.data?.groupId).toBe(NEW_GROUP_ID)
      expect(response.data?.candidates.filter((item) => item.selected).map((item) => item.classId)).toEqual([2, 3])
    })

    it('thêm và bớt lớp trong nhóm hiện có, lớp bị bớt không còn được chọn', async () => {
      const scenario = setup({ groups: [group(5, [1, 2, 3])] })

      const response = await scenario.useCase.execute(1, dto([3, 4]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledWith({
        groupId: 5,
        addClassIds: [4],
        removeClassIds: [2],
      })
      expect(response.data?.groupId).toBe(5)
      const byId = new Map(response.data?.candidates.map((item) => [item.classId, item]))
      expect(byId.get(2)).toMatchObject({ selected: false, disabled: false })
      expect(byId.get(3)?.selected).toBe(true)
      expect(byId.get(4)?.selected).toBe(true)
    })

    it('giải tán nhóm khi bỏ hết lớp bạn', async () => {
      const scenario = setup({ groups: [group(5, [1, 2, 3])] })

      const response = await scenario.useCase.execute(1, dto([]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.dissolveGroup).toHaveBeenCalledWith(5)
      expect(scenario.courseClassMakeupGroupRepository.saveGroup).not.toHaveBeenCalled()
      expect(response.data?.groupId).toBeNull()
      expect(response.data?.candidates.every((item) => item.selected === false)).toBe(true)
    })

    it('không ghi và không audit khi tập lớp bạn không đổi', async () => {
      const scenario = setup({ groups: [group(5, [1, 2, 3])] })

      const response = await scenario.useCase.execute(1, dto([3, 2]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.saveGroup).not.toHaveBeenCalled()
      expect(scenario.courseClassMakeupGroupRepository.dissolveGroup).not.toHaveBeenCalled()
      expect(scenario.adminAuditLogRepository.create).not.toHaveBeenCalled()
      expect(response.data?.candidates.filter((item) => item.selected).map((item) => item.classId)).toEqual([2, 3])
    })

    it('lớp chưa có nhóm và gửi mảng rỗng là không có gì để đổi', async () => {
      const scenario = setup()

      await scenario.useCase.execute(1, dto([]), ADMIN_ID)

      expect(scenario.courseClassMakeupGroupRepository.saveGroup).not.toHaveBeenCalled()
      expect(scenario.courseClassMakeupGroupRepository.dissolveGroup).not.toHaveBeenCalled()
    })

    it('cho phép giữ và bỏ lớp đã kết thúc đang cùng nhóm', async () => {
      const classes = [
        courseClass(1),
        courseClass(2, { endDate: new Date('2026-10-03T00:00:00.000Z') }),
        courseClass(3),
      ]
      const keep = setup({ classes, groups: [group(5, [1, 2])] })
      await keep.useCase.execute(1, dto([2, 3]), ADMIN_ID)
      expect(keep.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledWith({
        groupId: 5,
        addClassIds: [3],
        removeClassIds: [],
      })

      const remove = setup({ classes, groups: [group(5, [1, 2])] })
      await remove.useCase.execute(1, dto([3]), ADMIN_ID)
      expect(remove.courseClassMakeupGroupRepository.saveGroup).toHaveBeenCalledWith({
        groupId: 5,
        addClassIds: [3],
        removeClassIds: [2],
      })
    })
  })

  describe('transaction và audit', () => {
    it('chạy trong một transaction READ COMMITTED theo đúng thứ tự', async () => {
      const scenario = setup()
      await scenario.useCase.execute(1, dto([2, 3]), ADMIN_ID)

      expect(scenario.executeInTransaction).toHaveBeenCalledTimes(1)
      expect(scenario.executeInTransaction.mock.calls[0][1]).toEqual({ isolationLevel: 'ReadCommitted' })
      expect(scenario.calls).toEqual(['findSource', 'lock', 'findTargets', 'classes', 'groups', 'save', 'audit'])
    })

    it('lỗi ghi audit làm cả transaction thất bại để UnitOfWork rollback', async () => {
      const scenario = setup()
      scenario.adminAuditLogRepository.create.mockRejectedValueOnce(new Error('audit failed'))

      await expect(scenario.useCase.execute(1, dto([2]), ADMIN_ID)).rejects.toThrow('audit failed')
      expect(scenario.executeInTransaction).toHaveBeenCalledTimes(1)
    })

    it('ghi audit before/after đã sắp xếp kèm ID nhóm', async () => {
      const scenario = setup({ groups: [group(5, [1, 4, 2])] })
      await scenario.useCase.execute(1, dto([3, 2]), ADMIN_ID)

      expect(scenario.adminAuditLogRepository.create).toHaveBeenCalledTimes(1)
      expect(scenario.adminAuditLogRepository.create).toHaveBeenCalledWith({
        adminId: ADMIN_ID,
        actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.COURSE_CLASS,
        resourceId: '1',
        beforeData: { makeupGroupId: 5, makeupGroupClassIds: [1, 2, 4] },
        afterData: { makeupGroupId: 5, makeupGroupClassIds: [1, 2, 3] },
      })
    })

    it('audit khi giải tán nhóm ghi groupId sau là null và danh sách rỗng', async () => {
      const scenario = setup({ groups: [group(5, [1, 2])] })
      await scenario.useCase.execute(1, dto([]), ADMIN_ID)

      expect(scenario.adminAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          beforeData: { makeupGroupId: 5, makeupGroupClassIds: [1, 2] },
          afterData: { makeupGroupId: null, makeupGroupClassIds: [] },
        }),
      )
    })
  })
})
