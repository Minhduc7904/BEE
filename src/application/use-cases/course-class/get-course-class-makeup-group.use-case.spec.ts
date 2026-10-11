import type { IUnitOfWork } from '../../../domain/repositories'
import { CourseClass } from '../../../domain/entities/course-class/course-class.entity'
import type {
  CourseClassMakeupCandidate,
  MakeupGroup,
} from '../../../domain/interface/course-class/course-class-makeup-group.interface'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { GetCourseClassMakeupGroupUseCase } from './get-course-class-makeup-group.use-case'

function candidate(classId: number, overrides: Partial<CourseClassMakeupCandidate> = {}): CourseClassMakeupCandidate {
  return {
    classId,
    className: `Lớp ${classId}`,
    weeklySchedule: 'Thứ 4 - 18:00',
    startDate: new Date('2026-09-01T00:00:00.000Z'),
    endDate: new Date('2027-05-31T00:00:00.000Z'),
    room: 'P402',
    instructorName: 'Thầy Ngọc',
    ...overrides,
  }
}

function setup(source: CourseClass | null, classes: CourseClassMakeupCandidate[], groups: MakeupGroup[]) {
  const repos = {
    courseClassRepository: { findById: jest.fn().mockResolvedValue(source) },
    courseClassMakeupGroupRepository: {
      findClassesByCourse: jest.fn().mockResolvedValue(classes),
      findGroupsByCourse: jest.fn().mockResolvedValue(groups),
    },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn((work: (value: typeof repos) => Promise<unknown>) => work(repos)),
  } as unknown as IUnitOfWork

  return { useCase: new GetCourseClassMakeupGroupUseCase(unitOfWork), ...repos }
}

describe('GetCourseClassMakeupGroupUseCase', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-04T03:00:00.000Z') })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('trả 404 khi lớp nguồn không tồn tại', async () => {
    const scenario = setup(null, [], [])

    await expect(scenario.useCase.execute(1)).rejects.toBeInstanceOf(NotFoundException)
    expect(scenario.courseClassMakeupGroupRepository.findClassesByCourse).not.toHaveBeenCalled()
  })

  it('trả các lớp cùng khóa học trừ lớp nguồn kèm trạng thái cùng nhóm, nhóm khác và hết hạn', async () => {
    const source = new CourseClass({ classId: 151, courseId: 20, className: 'Đại 1 lớp 12A' })
    const scenario = setup(
      source,
      [
        candidate(151),
        candidate(152, { className: 'Đại 1 lớp 12B' }),
        candidate(153, { endDate: new Date('2026-10-03T00:00:00.000Z') }),
        candidate(154),
        candidate(155),
      ],
      [
        { groupId: 3, memberClassIds: [151, 152] },
        { groupId: 4, memberClassIds: [154, 155] },
      ],
    )

    const response = await scenario.useCase.execute(151)

    expect(scenario.courseClassMakeupGroupRepository.findClassesByCourse).toHaveBeenCalledWith(20)
    expect(scenario.courseClassMakeupGroupRepository.findGroupsByCourse).toHaveBeenCalledWith(20)
    expect(response.success).toBe(true)
    expect(response.data?.sourceClassId).toBe(151)
    expect(response.data?.courseId).toBe(20)
    expect(response.data?.groupId).toBe(3)
    expect(response.data?.candidates.map((item) => item.classId)).toEqual([152, 153, 154, 155])
    expect(response.data?.candidates[0]).toMatchObject({
      classId: 152,
      className: 'Đại 1 lớp 12B',
      weeklySchedule: 'Thứ 4 - 18:00',
      startDate: '2026-09-01',
      endDate: '2027-05-31',
      room: 'P402',
      instructorName: 'Thầy Ngọc',
      selected: true,
      disabled: false,
      disabledReason: null,
    })
    expect(response.data?.candidates[1]).toMatchObject({ isExpired: true, selected: false, disabled: true })
    expect(response.data?.candidates[2]).toMatchObject({ selected: false, disabled: true })
    expect(response.data?.candidates[3]).toMatchObject({ selected: false, disabled: true })
  })

  it('lớp chưa thuộc nhóm nào thì groupId là null', async () => {
    const source = new CourseClass({ classId: 1, courseId: 20, className: 'A' })
    const scenario = setup(source, [candidate(1), candidate(2)], [])

    const response = await scenario.useCase.execute(1)

    expect(response.data?.groupId).toBeNull()
    expect(response.data?.candidates).toHaveLength(1)
    expect(response.data?.candidates[0]).toMatchObject({ classId: 2, selected: false, disabled: false })
  })
})
