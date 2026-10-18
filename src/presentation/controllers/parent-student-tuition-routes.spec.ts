import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { BaseResponseDto } from '../../application/dtos'
import type { AuthenticatedUser } from '../../application/interfaces'
import { ParentStudentDashboardReadService, ParentStudentTuitionReadService } from '../../application/interfaces'
import { VerifyAccessTokenUseCase } from '../../application/use-cases/auth/verify-access-token.use-case'
import * as dashboardUseCases from '../../application/use-cases/parent-student-dashboard'
import { GetMyTuitionPaymentInstructionsUseCase } from '../../application/use-cases/payment-attempt/get-my-tuition-payment-instructions.use-case'
import * as tuitionUseCases from '../../application/use-cases/parent-student-tuition'
import {
  PaymentAttemptStatus,
  PaymentConfirmationMode,
  PaymentIntentStatus,
  TuitionPaymentStatus,
} from '../../shared/enums'
import { HttpExceptionFilter } from '../../shared/filters/http-exception.filter'
import { ParentStudentDashboardController } from './parent-student-dashboard.controller'
import { ParentStudentTuitionController } from './parent-student-tuition.controller'

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
}

const OWNED_STUDENT = 12
const OTHER_STUDENT = 99

const detailRecord = {
  paymentId: 7,
  studentId: OWNED_STUDENT,
  month: 10,
  year: 2026,
  amount: 1_500_000,
  status: TuitionPaymentStatus.UNPAID,
  paidAt: null,
  payerReportedTransferredAt: null,
  paymentIntent: null,
  attempts: [],
}

describe('Parent student tuition HTTP routes', () => {
  let app: INestApplication

  const isStudentLinked = jest.fn((parentId: number, studentId: number) =>
    Promise.resolve(parentId === 20 && studentId === OWNED_STUDENT),
  )
  const tuitionReader = {
    isStudentLinked,
    listPayments: jest.fn(),
    findPaymentDetail: jest.fn(),
  }
  const dashboardReader = {
    isStudentLinked,
    countAttendanceByStatus: jest.fn(),
    listUnpaidTuitionPayments: jest.fn().mockResolvedValue([]),
  }
  const studentInstructions = { execute: jest.fn() }
  const unitOfWork = { executeInTransaction: jest.fn() }

  beforeAll(async () => {
    const useCaseClasses = [...Object.values(dashboardUseCases), ...Object.values(tuitionUseCases)].filter(
      (value) => typeof value === 'function',
    ) as unknown as Array<new (...args: never[]) => unknown>

    const moduleRef = await Test.createTestingModule({
      // Cùng thứ tự với PresentationModule: route tĩnh outstanding-summary phải đăng ký trước `:paymentId`.
      controllers: [ParentStudentDashboardController, ParentStudentTuitionController],
      providers: [
        ...useCaseClasses,
        { provide: ParentStudentDashboardReadService, useValue: dashboardReader },
        { provide: ParentStudentTuitionReadService, useValue: tuitionReader },
        { provide: GetMyTuitionPaymentInstructionsUseCase, useValue: studentInstructions },
        { provide: 'UNIT_OF_WORK', useValue: unitOfWork },
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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    tuitionReader.listPayments.mockResolvedValue({ data: [], hasNext: false, nextCursor: null })
    tuitionReader.findPaymentDetail.mockResolvedValue(detailRecord)
    studentInstructions.execute.mockResolvedValue(BaseResponseDto.success('ok', { tuitionPaymentId: 7 }))
    unitOfWork.executeInTransaction.mockResolvedValue(undefined)
  })

  const get = (path: string, token?: string) => {
    const call = request(app.getHttpServer()).get(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  }
  const post = (path: string, token?: string) => {
    const call = request(app.getHttpServer()).post(path)
    return token ? call.set('Authorization', `Bearer ${token}`) : call
  }
  const base = (studentId: number) => `/parent/students/${studentId}/tuition-payments`

  it('keeps routing outstanding-summary to the dashboard handler, not to :paymentId', async () => {
    const response = await get(`${base(OWNED_STUDENT)}/outstanding-summary`, 'parent-a')

    expect(response.status).toBe(200)
    expect(dashboardReader.listUnpaidTuitionPayments).toHaveBeenCalledTimes(1)
    expect(tuitionReader.findPaymentDetail).not.toHaveBeenCalled()
  })

  describe.each([
    ['list', (studentId: number) => get(`${base(studentId)}?status=UNPAID`, 'parent-a')],
    ['detail', (studentId: number) => get(`${base(studentId)}/7`, 'parent-a')],
    ['payment-intent-status', (studentId: number) => get(`${base(studentId)}/7/payment-intent-status`, 'parent-a')],
    ['payment-instructions', (studentId: number) => get(`${base(studentId)}/7/payment-instructions`, 'parent-a')],
    ['report-transferred', (studentId: number) => post(`${base(studentId)}/7/report-transferred`, 'parent-a')],
  ])('%s authorization', (_, call) => {
    it('returns 200 for the parent that owns the student', async () => {
      const response = await call(OWNED_STUDENT)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('returns 403 for a student the parent does not manage and reads or writes nothing', async () => {
      const response = await call(OTHER_STUDENT)

      expect(response.status).toBe(403)
      expect(tuitionReader.listPayments).not.toHaveBeenCalled()
      expect(tuitionReader.findPaymentDetail).not.toHaveBeenCalled()
      expect(studentInstructions.execute).not.toHaveBeenCalled()
      expect(unitOfWork.executeInTransaction).not.toHaveBeenCalled()
    })
  })

  it.each([
    ['another parent', 'parent-b'],
    ['a student token', 'student'],
  ])('returns 403 for %s on every route', async (_, token) => {
    const responses = [
      await get(`${base(OWNED_STUDENT)}?status=UNPAID`, token),
      await get(`${base(OWNED_STUDENT)}/7`, token),
      await get(`${base(OWNED_STUDENT)}/7/payment-intent-status`, token),
      await get(`${base(OWNED_STUDENT)}/7/payment-instructions`, token),
      await post(`${base(OWNED_STUDENT)}/7/report-transferred`, token),
    ]

    expect(responses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403])
    expect(unitOfWork.executeInTransaction).not.toHaveBeenCalled()
  })

  it('returns 401 without a token', async () => {
    expect((await get(`${base(OWNED_STUDENT)}?status=UNPAID`)).status).toBe(401)
    expect((await post(`${base(OWNED_STUDENT)}/7/report-transferred`)).status).toBe(401)
  })

  describe('list query', () => {
    it.each([
      ['missing status', ''],
      ['unknown status', '?status=REFUNDED'],
      ['malformed cursor', '?status=UNPAID&after=abc'],
      ['legacy two-part cursor', '?status=UNPAID&after=1_2'],
      ['limit 0', '?status=UNPAID&limit=0'],
      ['limit 101', '?status=UNPAID&limit=101'],
    ])('rejects %s with 400', async (_, query) => {
      const response = await get(`${base(OWNED_STUDENT)}${query}`, 'parent-a')

      expect(response.status).toBe(400)
      expect(tuitionReader.listPayments).not.toHaveBeenCalled()
    })

    it('decodes the cursor and forwards status, limit and cursor to the reader', async () => {
      const response = await get(`${base(OWNED_STUDENT)}?status=PAID&after=2026_9_41&limit=5`, 'parent-a')

      expect(response.status).toBe(200)
      expect(tuitionReader.listPayments).toHaveBeenCalledWith(OWNED_STUDENT, {
        status: TuitionPaymentStatus.PAID,
        after: { year: 2026, month: 9, paymentId: 41 },
        limit: 5,
      })
      expect(response.body.meta).toEqual({ hasNext: false, nextCursor: null, limit: 5 })
    })

    it('maps rows with derived due date and overdue flag, and the next cursor', async () => {
      tuitionReader.listPayments.mockResolvedValue({
        data: [{ ...detailRecord, paymentId: 7, month: 1, year: 2020 }],
        hasNext: true,
        nextCursor: '2020_1_7',
      })

      const response = await get(`${base(OWNED_STUDENT)}?status=UNPAID`, 'parent-a')

      expect(response.status).toBe(200)
      expect(response.body.data[0]).toMatchObject({
        paymentId: 7,
        amount: 1_500_000,
        status: 'UNPAID',
        isOverdue: true,
        dueDateSource: 'PERIOD_END',
        payerReportedTransferred: false,
        payerReportedTransferredAt: null,
      })
      expect(response.body.meta).toEqual({ hasNext: true, nextCursor: '2020_1_7', limit: 10 })
    })
  })

  describe('detail and intent status', () => {
    it('returns 404 when the payment does not belong to the student', async () => {
      tuitionReader.findPaymentDetail.mockResolvedValue(null)

      expect((await get(`${base(OWNED_STUDENT)}/7`, 'parent-a')).status).toBe(404)
      expect((await get(`${base(OWNED_STUDENT)}/7/payment-intent-status`, 'parent-a')).status).toBe(404)
    })

    it('returns the status snapshot with a null intent instead of 404 for a payment that never opened a QR', async () => {
      const response = await get(`${base(OWNED_STUDENT)}/7/payment-intent-status`, 'parent-a')

      expect(response.status).toBe(200)
      expect(response.body.data).toEqual({
        tuitionPaymentId: 7,
        tuitionPaymentStatus: 'UNPAID',
        paidAt: null,
        payerReportedTransferred: false,
        payerReportedTransferredAt: null,
        paymentIntent: null,
      })
    })

    it('returns attempt history without internal fields', async () => {
      const createdAt = new Date('2026-10-10T01:00:00.000Z')
      const expiresAt = new Date('2026-10-10T01:15:00.000Z')
      tuitionReader.findPaymentDetail.mockResolvedValue({
        ...detailRecord,
        paymentIntent: { paymentIntentId: 3, status: PaymentIntentStatus.PENDING, updatedAt: createdAt },
        attempts: [
          {
            paymentAttemptId: 9,
            attemptCode: 'HPABCDE',
            amount: 1_500_000,
            confirmationMode: PaymentConfirmationMode.AUTOMATIC,
            status: PaymentAttemptStatus.PENDING,
            createdAt,
            expiresAt,
          },
        ],
      })

      const response = await get(`${base(OWNED_STUDENT)}/7`, 'parent-a')

      expect(response.status).toBe(200)
      expect(response.body.data.paymentIntent).toEqual({
        paymentIntentId: 3,
        intentStatus: 'PENDING',
        intentUpdatedAt: createdAt.toISOString(),
      })
      expect(response.body.data.attempts).toEqual([
        {
          paymentAttemptId: 9,
          attemptCode: 'HPABCDE',
          amount: 1_500_000,
          confirmationMode: 'AUTOMATIC',
          status: 'PENDING',
          createdAt: createdAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      ])
    })
  })

  it('delegates instructions to the shared student use case with the path student id, never a body value', async () => {
    const response = await get(`${base(OWNED_STUDENT)}/7/payment-instructions`, 'parent-a')

    expect(response.status).toBe(200)
    expect(studentInstructions.execute).toHaveBeenCalledWith(7, OWNED_STUDENT)
  })
})
