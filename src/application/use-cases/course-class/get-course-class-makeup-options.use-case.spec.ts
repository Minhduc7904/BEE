import type { IUnitOfWork } from '../../../domain/repositories'
import { CourseClass } from '../../../domain/entities/course-class/course-class.entity'
import type {
  CourseClassMakeupCandidate,
  CourseClassMakeupEdge,
} from '../../../domain/interface/course-class/course-class-makeup-option.interface'
import { NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { GetCourseClassMakeupOptionsUseCase } from './get-course-class-makeup-options.use-case'

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

function setup(source: CourseClass | null, classes: CourseClassMakeupCandidate[], edges: CourseClassMakeupEdge[]) {
  const repos = {
    courseClassRepository: { findById: jest.fn().mockResolvedValue(source) },
    courseClassMakeupOptionRepository: {
      findClassesByCourse: jest.fn().mockResolvedValue(classes),
      findEdgesByCourse: jest.fn().mockResolvedValue(edges),
    },
  }
  const unitOfWork = {
    executeInTransaction: jest.fn(async (work: (value: typeof repos) => Promise<unknown>) => work(repos)),
  } as unknown as IUnitOfWork

  return { useCase: new GetCourseClassMakeupOptionsUseCase(unitOfWork), ...repos }
}

describe('GetCourseClassMakeupOptionsUseCase', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-04T03:00:00.000Z') })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('trả 404 khi lớp nguồn không tồn tại', async () => {
    const scenario = setup(null, [], [])

    await expect(scenario.useCase.execute(1)).rejects.toBeInstanceOf(NotFoundException)
    expect(scenario.courseClassMakeupOptionRepository.findClassesByCourse).not.toHaveBeenCalled()
  })

  it('trả toàn bộ lớp cùng course trừ lớp nguồn kèm trạng thái chọn và disable', async () => {
    const source = new CourseClass({ classId: 151, courseId: 20, className: 'Đại 1 lớp 12A' })
    const scenario = setup(
      source,
      [
        candidate(151),
        candidate(152, { className: 'Đại 1 lớp 12B' }),
        candidate(153, { endDate: new Date('2026-10-03T00:00:00.000Z') }),
        candidate(154),
      ],
      [edge(151, 152), edge(154, 151)],
    )

    const response = await scenario.useCase.execute(151)

    expect(scenario.courseClassMakeupOptionRepository.findClassesByCourse).toHaveBeenCalledWith(20)
    expect(scenario.courseClassMakeupOptionRepository.findEdgesByCourse).toHaveBeenCalledWith(20)
    expect(response.success).toBe(true)
    expect(response.data?.sourceClassId).toBe(151)
    expect(response.data?.courseId).toBe(20)
    expect(response.data?.candidates.map((item) => item.classId)).toEqual([152, 153, 154])
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
  })
})

function edge(sourceClassId: number, makeupClassId: number): CourseClassMakeupEdge {
  return { sourceClassId, makeupClassId }
}
