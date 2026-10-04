import type { IUnitOfWork } from '../../../domain/repositories'
import { CourseClass } from '../../../domain/entities/course-class/course-class.entity'
import type {
  CourseClassMakeupCandidate,
  CourseClassMakeupEdge,
} from '../../../domain/interface/course-class/course-class-makeup-option.interface'
import { ReplaceCourseClassMakeupOptionsDto } from '../../dtos/course-class/replace-course-class-makeup-options.dto'
import { ACTION_KEYS } from '../../../shared/constants/action-key.constants'
import { RESOURCE_TYPES } from '../../../shared/constants/resource-type.constants'
import { AuditStatus } from '../../../shared/enums/audit-status.enum'
import {
  BusinessLogicException,
  ConflictException,
  NotFoundException,
} from '../../../shared/exceptions/custom-exceptions'
import {
  COURSE_CLASS_MAKEUP_CYCLE_CODE,
  ReplaceCourseClassMakeupOptionsUseCase,
} from './replace-course-class-makeup-options.use-case'

const COURSE_ID = 20
const ADMIN_ID = 7

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

function edge(sourceClassId: number, makeupClassId: number): CourseClassMakeupEdge {
  return { sourceClassId, makeupClassId }
}

function dto(makeupClassIds: number[]): ReplaceCourseClassMakeupOptionsDto {
  const body = new ReplaceCourseClassMakeupOptionsDto()
  body.makeupClassIds = makeupClassIds
  return body
}

function setup(params: { classes?: CourseClass[]; edges?: CourseClassMakeupEdge[] } = {}) {
  const classes = params.classes ?? [courseClass(1), courseClass(2), courseClass(3), courseClass(4)]
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
  const courseClassMakeupOptionRepository = {
    lockSourceClassForGraphUpdate: recorded('lockSource', (id: number) => {
      const found = classes.find((item) => item.classId === id)
      return found ? { classId: found.classId, courseId: found.courseId } : null
    }),
    lockCourseForGraphUpdate: recorded('lockCourse', () => undefined),
    findClassesByCourse: recorded('classes', () => classes.map((item) => candidate(item.classId))),
    findEdgesByCourse: recorded('edges', () => params.edges ?? []),
    replaceForSource: recorded('replace', () => undefined),
  }
  const adminAuditLogRepository = {
    create: recorded('audit', () => undefined),
  }
  const repos = { courseClassRepository, courseClassMakeupOptionRepository, adminAuditLogRepository }
  const executeInTransaction = jest.fn((work: (value: typeof repos) => Promise<unknown>) => work(repos))
  const unitOfWork = { executeInTransaction } as unknown as IUnitOfWork

  return {
    useCase: new ReplaceCourseClassMakeupOptionsUseCase(unitOfWork),
    calls,
    executeInTransaction,
    ...repos,
  }
}

describe('ReplaceCourseClassMakeupOptionsUseCase', () => {
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
    expect(scenario.courseClassMakeupOptionRepository.replaceForSource).not.toHaveBeenCalled()
    expect(scenario.adminAuditLogRepository.create).not.toHaveBeenCalled()
  }

  describe('validation', () => {
    it('trả 404 ngay từ locking read khi lớp nguồn không tồn tại, không đọc thêm dữ liệu nào', async () => {
      const scenario = setup()
      await expectRejected(scenario, 999, [2], NotFoundException)
      expect(scenario.calls).toEqual(['lockSource'])
      expect(scenario.courseClassRepository.findById).not.toHaveBeenCalled()
      expect(scenario.courseClassRepository.findByIds).not.toHaveBeenCalled()
    })

    it('từ chối ID trùng trong request (A→B hai lần)', async () => {
      const scenario = setup()
      await expectRejected(scenario, 1, [2, 2], BusinessLogicException)
      expect(scenario.courseClassRepository.findByIds).not.toHaveBeenCalled()
    })

    it('từ chối lớp nguồn nằm trong danh sách đích (A→A)', async () => {
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

    it('trả 404 khi có lớp đích không tồn tại và nêu rõ ID thiếu', async () => {
      const scenario = setup()
      await expect(scenario.useCase.execute(1, dto([2, 77, 88]), ADMIN_ID)).rejects.toThrow('77, 88')
      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).not.toHaveBeenCalled()
    })

    it('từ chối lớp đích khác course (A và B khác course)', async () => {
      const scenario = setup({ classes: [courseClass(1), courseClass(2, { courseId: 99 })] })
      await expectRejected(scenario, 1, [2], BusinessLogicException)
      expect(scenario.calls).not.toContain('replace')
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
      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).toHaveBeenCalledWith(1, [2])
    })
  })

  describe('chu trình', () => {
    it('từ chối khi đã có B→A rồi thêm A→B (chu trình trực tiếp)', async () => {
      const scenario = setup({ edges: [edge(2, 1)] })
      const failure = scenario.useCase.execute(1, dto([2]), ADMIN_ID)
      await expect(failure).rejects.toBeInstanceOf(ConflictException)
      await expect(failure).rejects.toMatchObject({ code: COURSE_CLASS_MAKEUP_CYCLE_CODE })
      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).not.toHaveBeenCalled()
      expect(scenario.adminAuditLogRepository.create).not.toHaveBeenCalled()
    })

    it('từ chối khi đã có B→C, C→A rồi thêm A→B (chu trình gián tiếp)', async () => {
      const scenario = setup({ edges: [edge(2, 3), edge(3, 1)] })
      await expectRejected(scenario, 1, [2], ConflictException)
    })

    it('không tính cạnh cũ đi ra từ nguồn khi kiểm tra chu trình', async () => {
      // Cạnh cũ 1→2 bị thay bằng 1→3; với 3→2 sẵn có, graph mới 1→3→2 không có chu trình.
      const scenario = setup({ edges: [edge(1, 2), edge(3, 2)] })
      await scenario.useCase.execute(1, dto([3]), ADMIN_ID)
      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).toHaveBeenCalledWith(1, [3])
    })

    it('cho phép A→B/C/D và B→C/D (DAG hợp lệ)', async () => {
      const scenario = setup({ edges: [edge(1, 2), edge(1, 3), edge(1, 4)] })
      await scenario.useCase.execute(2, dto([3, 4]), ADMIN_ID)
      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).toHaveBeenCalledWith(2, [3, 4])
    })

    it('từ chối D→A khi A→B/C/D và B→C/D đã tồn tại', async () => {
      const scenario = setup({ edges: [edge(1, 2), edge(1, 3), edge(1, 4), edge(2, 3), edge(2, 4)] })
      await expectRejected(scenario, 4, [1], ConflictException)
    })
  })

  describe('replace atomic', () => {
    it('khóa lớp nguồn rồi khóa course trước mọi lần đọc và chạy toàn bộ trong một transaction', async () => {
      const scenario = setup()
      await scenario.useCase.execute(1, dto([2, 3]), ADMIN_ID)

      expect(scenario.executeInTransaction).toHaveBeenCalledTimes(1)
      expect(scenario.calls).toEqual([
        'lockSource',
        'lockCourse',
        'findSource',
        'findTargets',
        'classes',
        'edges',
        'replace',
        'audit',
      ])
      expect(scenario.courseClassMakeupOptionRepository.lockSourceClassForGraphUpdate).toHaveBeenCalledWith(1)
      expect(scenario.courseClassMakeupOptionRepository.lockCourseForGraphUpdate).toHaveBeenCalledWith(COURSE_ID)
    })

    it('khóa course theo courseId lấy từ locking read, trước khi đọc lớp nguồn', async () => {
      const scenario = setup({ classes: [courseClass(1, { courseId: 55 }), courseClass(2, { courseId: 55 })] })
      await scenario.useCase.execute(1, dto([2]), ADMIN_ID)

      expect(scenario.courseClassMakeupOptionRepository.lockCourseForGraphUpdate).toHaveBeenCalledWith(55)
      expect(scenario.calls.indexOf('lockCourse')).toBeLessThan(scenario.calls.indexOf('findSource'))
    })

    it('lỗi ghi audit làm cả transaction thất bại để UnitOfWork rollback', async () => {
      const scenario = setup()
      scenario.adminAuditLogRepository.create.mockRejectedValueOnce(new Error('audit failed'))

      await expect(scenario.useCase.execute(1, dto([2]), ADMIN_ID)).rejects.toThrow('audit failed')
      expect(scenario.executeInTransaction).toHaveBeenCalledTimes(1)
    })

    it('thay cả tập cạnh cũ bằng tập mới và có thể xóa toàn bộ bằng mảng rỗng', async () => {
      const scenario = setup({ edges: [edge(1, 2), edge(1, 3)] })
      const response = await scenario.useCase.execute(1, dto([]), ADMIN_ID)

      expect(scenario.courseClassRepository.findByIds).not.toHaveBeenCalled()
      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).toHaveBeenCalledWith(1, [])
      expect(response.data?.candidates.every((item) => item.selected === false)).toBe(true)
    })

    it('không ghi và không audit khi tập lớp không thay đổi', async () => {
      const scenario = setup({ edges: [edge(1, 2), edge(1, 3)] })
      const response = await scenario.useCase.execute(1, dto([3, 2]), ADMIN_ID)

      expect(scenario.courseClassMakeupOptionRepository.replaceForSource).not.toHaveBeenCalled()
      expect(scenario.adminAuditLogRepository.create).not.toHaveBeenCalled()
      expect(response.data?.candidates.filter((item) => item.selected).map((item) => item.classId)).toEqual([2, 3])
    })

    it('cho phép giữ và bỏ lớp đã kết thúc đang được chọn', async () => {
      const classes = [
        courseClass(1),
        courseClass(2, { endDate: new Date('2026-10-03T00:00:00.000Z') }),
        courseClass(3),
      ]
      const keep = setup({ classes, edges: [edge(1, 2)] })
      await keep.useCase.execute(1, dto([2, 3]), ADMIN_ID)
      expect(keep.courseClassMakeupOptionRepository.replaceForSource).toHaveBeenCalledWith(1, [2, 3])

      const remove = setup({ classes, edges: [edge(1, 2)] })
      await remove.useCase.execute(1, dto([3]), ADMIN_ID)
      expect(remove.courseClassMakeupOptionRepository.replaceForSource).toHaveBeenCalledWith(1, [3])
    })
  })

  describe('audit', () => {
    it('ghi audit before/after đã sắp xếp với actor, action và resource đúng', async () => {
      const scenario = setup({ edges: [edge(1, 4), edge(1, 2)] })
      await scenario.useCase.execute(1, dto([3, 2]), ADMIN_ID)

      expect(scenario.adminAuditLogRepository.create).toHaveBeenCalledTimes(1)
      expect(scenario.adminAuditLogRepository.create).toHaveBeenCalledWith({
        adminId: ADMIN_ID,
        actionKey: ACTION_KEYS.COURSE_CLASS.UPDATE,
        status: AuditStatus.SUCCESS,
        resourceType: RESOURCE_TYPES.COURSE_CLASS,
        resourceId: '1',
        beforeData: { makeupClassIds: [2, 4] },
        afterData: { makeupClassIds: [2, 3] },
      })
    })
  })

  describe('response', () => {
    it('trả cấu hình sau cập nhật với lớp đã chọn và lớp bị disable do chu trình', async () => {
      const scenario = setup({ edges: [edge(3, 2)] })
      // Graph sau cập nhật: 1→2 và 3→2, nên lớp 3 vẫn thêm được vào lớp 1.
      const response = await scenario.useCase.execute(1, dto([2]), ADMIN_ID)

      expect(response.success).toBe(true)
      const byId = new Map(response.data?.candidates.map((item) => [item.classId, item]))
      expect(byId.get(2)?.selected).toBe(true)
      expect(byId.get(3)).toMatchObject({ selected: false, disabled: false })
    })
  })
})
