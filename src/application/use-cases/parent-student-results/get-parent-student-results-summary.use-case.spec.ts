import type { AuthenticatedUser, ParentMonthlyResultItem, ParentStudentResultsReadService } from '../../interfaces'
import { ParentMonthQueryDto } from '../../dtos/parent-student-dashboard'
import { ParentResultType } from '../../../shared/enums/parent-result-type.enum'
import { GetParentStudentResultsSummaryUseCase } from '.'
import { summarizeMonthlyResults } from './summarize-monthly-results'

const parentIdentity: AuthenticatedUser = {
  userId: 10,
  username: 'parent-test',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

function query(month: number, year: number): ParentMonthQueryDto {
  const dto = new ParentMonthQueryDto()
  dto.month = month
  dto.year = year
  return dto
}

function item(overrides: Partial<ParentMonthlyResultItem> = {}): ParentMonthlyResultItem {
  return {
    type: ParentResultType.HOMEWORK,
    resultId: 1,
    title: 'Hàm số bậc hai',
    submittedAt: new Date('2026-10-04T13:15:00.000Z'),
    points: 9,
    maxPoints: 10,
    ...overrides,
  }
}

function service(items: ParentMonthlyResultItem[] = [], linked = true) {
  return {
    isStudentLinked: jest.fn().mockResolvedValue(linked),
    listMonthlyResults: jest.fn().mockResolvedValue(items),
  } as unknown as jest.Mocked<ParentStudentResultsReadService>
}

describe('summarizeMonthlyResults', () => {
  it('returns null average and latest for an empty month', () => {
    expect(summarizeMonthlyResults(11, 2026, [])).toEqual({
      month: 11,
      year: 2026,
      totalResults: 0,
      scoredResults: 0,
      averageScore: null,
      latestResult: null,
    })
  })

  it('merges homework and competition items and averages only scale-10 scored items', () => {
    const summary = summarizeMonthlyResults(10, 2026, [
      item({ resultId: 1, points: 9, maxPoints: 10 }),
      item({ type: ParentResultType.COMPETITION, resultId: 2, points: 8, maxPoints: 10 }),
      item({ resultId: 3, points: 7.5, maxPoints: 10 }),
      item({ type: ParentResultType.COMPETITION, resultId: 4, points: 8.5, maxPoints: 10 }),
      item({ resultId: 5, points: 95, maxPoints: 100 }),
    ])

    expect(summary).toMatchObject({ totalResults: 5, scoredResults: 4, averageScore: 8.25 })
  })

  it('ignores unscored items and non-10 scales in the average but still counts them in the total', () => {
    const summary = summarizeMonthlyResults(10, 2026, [
      item({ resultId: 1, points: null, maxPoints: 10 }),
      item({ resultId: 2, points: 40, maxPoints: 50 }),
      item({ resultId: 3, points: 9, maxPoints: null }),
    ])

    expect(summary).toMatchObject({ totalResults: 3, scoredResults: 0, averageScore: null })
  })

  it('counts a zero score as a valid score', () => {
    const summary = summarizeMonthlyResults(10, 2026, [item({ points: 0, maxPoints: 10 })])

    expect(summary).toMatchObject({ scoredResults: 1, averageScore: 0 })
  })

  it('rounds the average to two decimals', () => {
    const summary = summarizeMonthlyResults(10, 2026, [
      item({ resultId: 1, points: 10 }),
      item({ resultId: 2, points: 9 }),
      item({ resultId: 3, points: 9 }),
    ])

    expect(summary.averageScore).toBe(9.33)
  })

  it('picks the latest by submittedAt with the right type and id', () => {
    const summary = summarizeMonthlyResults(10, 2026, [
      item({ type: ParentResultType.HOMEWORK, resultId: 456, submittedAt: new Date('2026-10-04T13:15:00.000Z') }),
      item({ type: ParentResultType.COMPETITION, resultId: 789, submittedAt: new Date('2026-10-20T01:00:00.000Z') }),
      item({ type: ParentResultType.HOMEWORK, resultId: 12, submittedAt: new Date('2026-10-10T01:00:00.000Z') }),
    ])

    expect(summary.latestResult).toMatchObject({ type: ParentResultType.COMPETITION, resultId: 789 })
  })

  it('breaks a submittedAt tie deterministically: HOMEWORK first, then the larger id', () => {
    const at = new Date('2026-10-04T13:15:00.000Z')

    const homeworkWins = summarizeMonthlyResults(10, 2026, [
      item({ type: ParentResultType.COMPETITION, resultId: 99, submittedAt: at }),
      item({ type: ParentResultType.HOMEWORK, resultId: 1, submittedAt: at }),
    ])
    const largerIdWins = summarizeMonthlyResults(10, 2026, [
      item({ resultId: 1, submittedAt: at }),
      item({ resultId: 2, submittedAt: at }),
    ])

    expect(homeworkWins.latestResult).toMatchObject({ type: ParentResultType.HOMEWORK, resultId: 1 })
    expect(largerIdWins.latestResult?.resultId).toBe(2)
  })

  it('does not mutate the input order', () => {
    const items = [item({ resultId: 1, submittedAt: new Date('2026-10-01T00:00:00.000Z') }), item({ resultId: 2 })]

    summarizeMonthlyResults(10, 2026, items)

    expect(items.map((value) => value.resultId)).toEqual([1, 2])
  })
})

describe('GetParentStudentResultsSummaryUseCase', () => {
  it('rejects a parent that is not linked to the student before reading results', async () => {
    const reader = service([item()], false)

    await expect(
      new GetParentStudentResultsSummaryUseCase(reader).execute(parentIdentity, 99, query(10, 2026)),
    ).rejects.toHaveProperty('name', 'ForbiddenException')

    expect(reader.isStudentLinked).toHaveBeenCalledWith(20, 99)
    expect(reader.listMonthlyResults).not.toHaveBeenCalled()
  })

  it.each([
    ['student', { userType: 'student', studentId: 99 } as Partial<AuthenticatedUser>],
    ['admin', { userType: 'admin', adminId: 1 } as Partial<AuthenticatedUser>],
    ['parent without parentId', { parentId: undefined } as Partial<AuthenticatedUser>],
  ])('rejects %s identity', async (_, override) => {
    const reader = service([item()])

    await expect(
      new GetParentStudentResultsSummaryUseCase(reader).execute(
        { ...parentIdentity, ...override },
        99,
        query(10, 2026),
      ),
    ).rejects.toHaveProperty('name', 'ForbiddenException')
    expect(reader.listMonthlyResults).not.toHaveBeenCalled()
  })

  it('queries the Vietnam month converted to UTC', async () => {
    const reader = service()

    await new GetParentStudentResultsSummaryUseCase(reader).execute(parentIdentity, 12, query(10, 2026))

    expect(reader.listMonthlyResults).toHaveBeenCalledWith(
      12,
      new Date('2026-09-30T17:00:00.000Z'),
      new Date('2026-10-31T17:00:00.000Z'),
    )
  })

  it('returns the documented wire shape', async () => {
    const reader = service([
      item({ resultId: 456, submittedAt: new Date('2026-10-04T13:15:00.000Z'), points: 9 }),
      item({ resultId: 2, submittedAt: new Date('2026-10-01T01:00:00.000Z'), points: 8 }),
      item({
        type: ParentResultType.COMPETITION,
        resultId: 3,
        submittedAt: new Date('2026-10-02T01:00:00.000Z'),
        points: 8,
      }),
      item({ resultId: 4, submittedAt: new Date('2026-10-03T01:00:00.000Z'), points: 8 }),
      item({ resultId: 5, submittedAt: new Date('2026-10-03T02:00:00.000Z'), points: null }),
    ])

    const result = await new GetParentStudentResultsSummaryUseCase(reader).execute(parentIdentity, 12, query(10, 2026))

    expect(result).toEqual({
      success: true,
      message: 'Lấy tổng quan kết quả học tập thành công',
      data: {
        month: 10,
        year: 2026,
        totalResults: 5,
        scoredResults: 4,
        averageScore: 8.25,
        scoreScale: 10,
        latestResult: {
          type: 'HOMEWORK',
          resultId: 456,
          title: 'Hàm số bậc hai',
          submittedAt: '2026-10-04T13:15:00.000Z',
          points: 9,
          maxPoints: 10,
        },
      },
    })
  })

  it('returns scoreScale 10 with null average/latest for an empty month', async () => {
    const result = await new GetParentStudentResultsSummaryUseCase(service()).execute(
      parentIdentity,
      12,
      query(11, 2026),
    )

    expect(result.data).toEqual({
      month: 11,
      year: 2026,
      totalResults: 0,
      scoredResults: 0,
      averageScore: null,
      scoreScale: 10,
      latestResult: null,
    })
  })
})
