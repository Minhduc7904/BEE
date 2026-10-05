import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import type { AuthenticatedUser } from '../../application/interfaces'
import {
  ParentScheduleSessionDetailReadService,
  ParentStudentDashboardReadService,
  ParentStudentResultsReadService,
  ParentStudentScheduleReadService,
} from '../../application/interfaces'
import { VerifyAccessTokenUseCase } from '../../application/use-cases/auth/verify-access-token.use-case'
import * as dashboardUseCases from '../../application/use-cases/parent-student-dashboard'
import * as resultsUseCases from '../../application/use-cases/parent-student-results'
import * as scheduleUseCases from '../../application/use-cases/parent-student-schedule'
import { HttpExceptionFilter } from '../../shared/filters/http-exception.filter'
import { ParentStudentDashboardController } from './parent-student-dashboard.controller'
import { ParentStudentResultsController } from './parent-student-results.controller'
import { ParentStudentScheduleController } from './parent-student-schedule.controller'

const parentA: AuthenticatedUser = {
  userId: 10,
  username: 'parent-a',
  userType: 'parent',
  parentId: 20,
  roles: [],
  permissions: [],
}

const tokens: Record<string, AuthenticatedUser> = {
  'parent-a': parentA,
  'parent-b': { ...parentA, userId: 11, username: 'parent-b', parentId: 21 },
  student: { userId: 12, username: 'student', userType: 'student', studentId: 12, roles: [], permissions: [] },
  admin: { userId: 13, username: 'admin', userType: 'admin', adminId: 1, roles: [], permissions: [] },
}

const OWNED_STUDENT = 12
const OTHER_STUDENT = 99

describe('Parent student dashboard HTTP routes', () => {
  let app: INestApplication

  // Parent 20 (parent-a) owns only student 12.
  const isStudentLinked = jest.fn((parentId: number, studentId: number) =>
    Promise.resolve(parentId === 20 && studentId === OWNED_STUDENT),
  )
  const scheduleReader = {
    isStudentLinked,
    listSessionsInRange: jest.fn().mockResolvedValue([]),
    findNextSession: jest.fn().mockResolvedValue(null),
  }
  const sessionDetailReader = { findSessionDetail: jest.fn().mockResolvedValue(null) }
  const resultsReader = { isStudentLinked, listMonthlyResults: jest.fn().mockResolvedValue([]) }
  const dashboardReader = {
    isStudentLinked,
    countAttendanceByStatus: jest.fn().mockResolvedValue({ present: 8, absent: 2, late: 1, makeup: 1 }),
    listUnpaidTuitionPayments: jest.fn().mockResolvedValue([]),
  }

  beforeAll(async () => {
    const useCaseClasses = [
      ...Object.values(scheduleUseCases),
      ...Object.values(resultsUseCases),
      ...Object.values(dashboardUseCases),
    ].filter((value): value is new (...args: never[]) => unknown => typeof value === 'function')

    const moduleRef = await Test.createTestingModule({
      controllers: [ParentStudentScheduleController, ParentStudentResultsController, ParentStudentDashboardController],
      providers: [
        ...useCaseClasses,
        { provide: ParentStudentScheduleReadService, useValue: scheduleReader },
        { provide: ParentScheduleSessionDetailReadService, useValue: sessionDetailReader },
        { provide: ParentStudentResultsReadService, useValue: resultsReader },
        { provide: ParentStudentDashboardReadService, useValue: dashboardReader },
        {
          provide: VerifyAccessTokenUseCase,
          useValue: {
            execute: (token: string) => {
              const user = tokens[token]
              if (!user) throw new UnauthorizedException('Token không hợp lệ')
              return Promise.resolve(user)
            },
          },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    // Giống src/main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const get = (path: string, token?: string) => {
    const call = request(app.getHttpServer()).get(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  }

  describe('/schedule/next routing', () => {
    it('routes /schedule/next to the next-session handler, not to :sessionId', async () => {
      const response = await get(`/parent/students/${OWNED_STUDENT}/schedule/next`, 'parent-a')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true, message: 'Không có buổi học sắp tới', data: null })
      expect(scheduleReader.findNextSession).toHaveBeenCalledTimes(1)
      expect(sessionDetailReader.findSessionDetail).not.toHaveBeenCalled()
    })

    it('still routes a numeric session id to the detail handler', async () => {
      const response = await get(`/parent/students/${OWNED_STUDENT}/schedule/55`, 'parent-a')

      expect(response.status).toBe(404)
      expect(sessionDetailReader.findSessionDetail).toHaveBeenCalledWith(OWNED_STUDENT, 55, expect.any(Date))
      expect(scheduleReader.findNextSession).not.toHaveBeenCalled()
    })

    it('rejects a non-numeric, non-next segment with 400 from ParseIntPipe', async () => {
      const response = await get(`/parent/students/${OWNED_STUDENT}/schedule/tomorrow`, 'parent-a')

      expect(response.status).toBe(400)
    })
  })

  describe.each([
    ['next schedule', (studentId: number) => `/parent/students/${studentId}/schedule/next`],
    [
      'attendance statistics',
      (studentId: number) => `/parent/students/${studentId}/attendance/statistics?month=10&year=2026`,
    ],
    ['results summary', (studentId: number) => `/parent/students/${studentId}/results/summary?month=10&year=2026`],
    [
      'outstanding tuition summary',
      (studentId: number) => `/parent/students/${studentId}/tuition-payments/outstanding-summary`,
    ],
  ])('%s authorization', (_, url) => {
    it('returns 200 for the parent that owns the student', async () => {
      const response = await get(url(OWNED_STUDENT), 'parent-a')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('returns 403 for another parent and does not read data', async () => {
      const response = await get(url(OWNED_STUDENT), 'parent-b')

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expectNoDataRead()
    })

    it('returns 403 for a valid parent asking for a student they do not own', async () => {
      const response = await get(url(OTHER_STUDENT), 'parent-a')

      expect(response.status).toBe(403)
      expectNoDataRead()
    })

    it.each(['student', 'admin'])('returns 403 for a %s token', async (token) => {
      const response = await get(url(OWNED_STUDENT), token)

      expect(response.status).toBe(403)
      expectNoDataRead()
    })

    it('returns 401 without a token', async () => {
      const response = await get(url(OWNED_STUDENT))

      expect(response.status).toBe(401)
      expectNoDataRead()
    })

    it('returns 401 with an invalid token', async () => {
      const response = await get(url(OWNED_STUDENT), 'expired')

      expect(response.status).toBe(401)
      expectNoDataRead()
    })
  })

  describe.each([
    ['attendance statistics', (query: string) => `/parent/students/${OWNED_STUDENT}/attendance/statistics${query}`],
    ['results summary', (query: string) => `/parent/students/${OWNED_STUDENT}/results/summary${query}`],
  ])('%s month/year validation', (_, url) => {
    it.each([
      ['month missing', '?year=2026'],
      ['year missing', '?month=10'],
      ['both missing', ''],
      ['month 0', '?month=0&year=2026'],
      ['month 13', '?month=13&year=2026'],
      ['month not a number', '?month=abc&year=2026'],
      ['month fractional', '?month=1.5&year=2026'],
      ['year 1999', '?month=10&year=1999'],
      ['year 2101', '?month=10&year=2101'],
      ['unknown query param', '?month=10&year=2026&parentId=21'],
    ])('returns 400 when %s', async (_label, query) => {
      const response = await get(url(query), 'parent-a')

      expect(response.status).toBe(400)
      expect(dashboardReader.countAttendanceByStatus).not.toHaveBeenCalled()
      expect(resultsReader.listMonthlyResults).not.toHaveBeenCalled()
    })

    it.each([
      ['lowest bounds', '?month=1&year=2000'],
      ['highest bounds', '?month=12&year=2100'],
    ])('accepts %s', async (_label, query) => {
      const response = await get(url(query), 'parent-a')

      expect(response.status).toBe(200)
    })
  })

  it('returns the attendance summary wire shape over HTTP', async () => {
    const response = await get(`/parent/students/${OWNED_STUDENT}/attendance/statistics?month=10&year=2026`, 'parent-a')

    expect(response.body).toEqual({
      success: true,
      message: 'Lấy thống kê điểm danh thành công',
      data: {
        month: 10,
        year: 2026,
        total: 12,
        present: 8,
        absent: 2,
        late: 1,
        makeup: 1,
        attended: 10,
        attendanceRate: 83.33,
      },
    })
  })

  function expectNoDataRead() {
    expect(scheduleReader.findNextSession).not.toHaveBeenCalled()
    expect(dashboardReader.countAttendanceByStatus).not.toHaveBeenCalled()
    expect(dashboardReader.listUnpaidTuitionPayments).not.toHaveBeenCalled()
    expect(resultsReader.listMonthlyResults).not.toHaveBeenCalled()
  }
})
