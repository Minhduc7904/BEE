import { HomeworkContentType } from 'src/shared/enums'
import { HomeworkStatus, StudentHomeworkQueryDto } from '../../dtos/learningItem/student-homework-query.dto'
import { HomeworkContentWithStatusDto } from '../../dtos/learningItem/student-homework.dto'
import { GetStudentHomeworksUseCase } from './get-student-homeworks.use-case'

describe('GetStudentHomeworksUseCase', () => {
  const studentId = 10
  let prisma: any
  let lessonAccessService: any
  let useCase: GetStudentHomeworksUseCase

  beforeEach(() => {
    prisma = {
      courseEnrollment: {
        findMany: jest.fn().mockResolvedValue([{ courseId: 80 }]),
      },
      learningItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      homeworkSubmit: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    }
    lessonAccessService = {
      getLessonLearningItemAccessFilters: jest.fn().mockResolvedValue([{ lessonId: { in: [21] } }]),
    }
    useCase = new GetStudentHomeworksUseCase(prisma, lessonAccessService)
  })

  it('filters INCOMPLETE by absence of HomeworkSubmit', async () => {
    await useCase.execute(
      studentId,
      Object.assign(new StudentHomeworkQueryDto(), {
        status: HomeworkStatus.INCOMPLETE,
      }),
    )

    const where = prisma.learningItem.findMany.mock.calls[0][0].where
    expect(where.homeworkContents).toEqual({
      some: {},
      none: {
        homeworkSubmits: { some: { studentId } },
      },
    })
  })

  it('filters COMPLETED by presence of HomeworkSubmit', async () => {
    await useCase.execute(
      studentId,
      Object.assign(new StudentHomeworkQueryDto(), {
        status: HomeworkStatus.COMPLETED,
      }),
    )

    const where = prisma.learningItem.findMany.mock.calls[0][0].where
    expect(where.homeworkContents).toEqual({
      some: {
        homeworkSubmits: { some: { studentId } },
      },
    })
  })

  it('builds type-specific OVERDUE conditions', async () => {
    await useCase.execute(
      studentId,
      Object.assign(new StudentHomeworkQueryDto(), {
        status: HomeworkStatus.OVERDUE,
      }),
    )

    const conditions = prisma.learningItem.findMany.mock.calls[0][0].where.homeworkContents.some.OR

    expect(conditions).toEqual([
      {
        type: HomeworkContentType.FILE_UPLOAD,
        dueDate: { lt: expect.any(Date) },
      },
      {
        type: HomeworkContentType.COMPETITION,
        OR: [
          { dueDate: { lt: expect.any(Date) } },
          {
            competition: {
              is: {
                endDate: { lt: expect.any(Date) },
              },
            },
          },
        ],
      },
    ])
  })
})

describe('HomeworkContentWithStatusDto overdue', () => {
  const future = new Date(Date.now() + 60_000)
  const past = new Date(Date.now() - 60_000)

  const createDto = (data: { type: HomeworkContentType; dueDate: Date | null; competitionEndDate?: Date | null }) =>
    new HomeworkContentWithStatusDto({
      homeworkContent: {
        homeworkContentId: 1,
        type: data.type,
        content: 'Bài tập',
        dueDate: data.dueDate,
        allowLateSubmit: false,
        competitionId: data.type === HomeworkContentType.COMPETITION ? 2 : null,
        competition:
          data.type === HomeworkContentType.COMPETITION
            ? ({
                competitionId: 2,
                title: 'Cuộc thi',
                subtitle: null,
                startDate: null,
                endDate: data.competitionEndDate ?? null,
                durationMinutes: null,
                maxAttempts: null,
                examId: null,
                visibility: 'PUBLISHED',
                showResultDetail: false,
                allowLeaderboard: false,
                allowViewScore: true,
                allowViewAnswer: false,
                enableAntiCheating: false,
                allowViewSolutionYoutubeUrl: false,
                allowViewExamContent: false,
              } as const)
            : null,
      },
      homeworkSubmit: null,
    })

  it('treats FILE_UPLOAD with no dueDate as unlimited', () => {
    expect(createDto({ type: HomeworkContentType.FILE_UPLOAD, dueDate: null }).isOverdue).toBe(false)
  })

  it('uses only homework dueDate for FILE_UPLOAD', () => {
    expect(createDto({ type: HomeworkContentType.FILE_UPLOAD, dueDate: past }).isOverdue).toBe(true)
  })

  it('marks COMPETITION overdue when either deadline has expired', () => {
    expect(
      createDto({
        type: HomeworkContentType.COMPETITION,
        dueDate: future,
        competitionEndDate: past,
      }).isOverdue,
    ).toBe(true)
  })

  it('treats COMPETITION with no deadlines as unlimited', () => {
    expect(
      createDto({
        type: HomeworkContentType.COMPETITION,
        dueDate: null,
        competitionEndDate: null,
      }).isOverdue,
    ).toBe(false)
  })
})
