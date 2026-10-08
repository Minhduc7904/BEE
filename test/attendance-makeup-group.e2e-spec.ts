import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { ExecutionContext } from '@nestjs/common'
import request from 'supertest'
import { AttendanceController } from '../src/presentation/controllers/attendance.controller'
import { CourseClassController } from '../src/presentation/controllers/course-class.controller'
import * as attendanceUseCases from '../src/application/use-cases/attendance'
import * as courseClassUseCases from '../src/application/use-cases/course-class'
import { AuthGuard } from '../src/shared/guards/auth.guard'
import { PermissionsGuard } from '../src/shared/guards/permissions.guard'
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter'
import { NormalizeArrayQueryPipe } from '../src/shared/pipes/normalize-array-query.pipe'
import { ConflictException } from '../src/shared/exceptions/custom-exceptions'
import { COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE } from '../src/domain/interface/course-class/course-class-makeup-group.interface'

/**
 * HTTP-level contract test: real controllers, the production validation pipe and exception filter,
 * with the use cases replaced by mocks (no database or external service is needed).
 */
function mocksFor(module: Record<string, unknown>, names: string[]) {
  return names.map((name) => ({ provide: module[name], useValue: { execute: jest.fn().mockResolvedValue({ success: true, data: {} }) } }))
}

describe('Attendance + makeup group HTTP contract (e2e)', () => {
  let app: INestApplication
  let listAttendances: jest.Mock
  let createAttendance: jest.Mock
  let updateAttendance: jest.Mock
  let createBulk: jest.Mock
  let getGroup: jest.Mock
  let replaceGroup: jest.Mock

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AttendanceController, CourseClassController],
      providers: [
        ...mocksFor(attendanceUseCases, [
          'GetAllAttendanceUseCase',
          'GetAttendanceByIdUseCase',
          'CreateAttendanceUseCase',
          'UpdateAttendanceUseCase',
          'DeleteAttendanceUseCase',
          'CreateBulkAttendanceBySessionUseCase',
          'GetAttendanceStatisticsBySessionUseCase',
          'ExportAttendanceBySessionUseCase',
          'ExportAttendanceImageUseCase',
          'SendAttendanceToParentUseCase',
          'ToggleParentNotifiedUseCase',
        ]),
        ...mocksFor(courseClassUseCases, [
          'GetAllCourseClassUseCase',
          'GetCourseClassByIdUseCase',
          'CreateCourseClassUseCase',
          'UpdateCourseClassUseCase',
          'DeleteCourseClassUseCase',
          'SearchCourseClassesUseCase',
          'GetCourseClassMakeupGroupUseCase',
          'ReplaceCourseClassMakeupGroupUseCase',
        ]),
      ],
    })
      // Authentication/permission logic has its own tests; here only the HTTP contract is under test.
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{ user?: unknown }>()
          req.user = { adminId: 9, permissions: [] }
          return true
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(
      new NormalizeArrayQueryPipe(),
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    )
    app.useGlobalFilters(new HttpExceptionFilter())
    await app.init()

    const executeOf = (token: unknown) => (moduleRef.get(token as never)).execute
    listAttendances = executeOf(attendanceUseCases.GetAllAttendanceUseCase)
    createAttendance = executeOf(attendanceUseCases.CreateAttendanceUseCase)
    updateAttendance = executeOf(attendanceUseCases.UpdateAttendanceUseCase)
    createBulk = executeOf(attendanceUseCases.CreateBulkAttendanceBySessionUseCase)
    getGroup = executeOf(courseClassUseCases.GetCourseClassMakeupGroupUseCase)
    replaceGroup = executeOf(courseClassUseCases.ReplaceCourseClassMakeupGroupUseCase)
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('attendance', () => {
    it('GET /api/attendances?attendanceType=MAKEUP chuyển filter đến use case', async () => {
      await request(app.getHttpServer()).get('/api/attendances?attendanceType=MAKEUP&status=PRESENT').expect(200)

      expect(listAttendances.mock.calls[0][0]).toMatchObject({ attendanceType: 'MAKEUP', status: 'PRESENT' })
    })

    it('GET /api/attendances từ chối attendanceType không hợp lệ', async () => {
      await request(app.getHttpServer()).get('/api/attendances?attendanceType=BOGUS').expect(400)
      expect(listAttendances).not.toHaveBeenCalled()
    })

    it('POST /api/attendances nhận attendanceType tùy chọn', async () => {
      await request(app.getHttpServer())
        .post('/api/attendances')
        .send({ sessionId: 1, studentId: 2, status: 'PRESENT', attendanceType: 'MAKEUP' })
        .expect(201)
      await request(app.getHttpServer()).post('/api/attendances').send({ sessionId: 1, studentId: 2, status: 'PRESENT' }).expect(201)

      expect(createAttendance.mock.calls[0][0]).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP' })
      expect(createAttendance.mock.calls[1][0].attendanceType).toBeUndefined()
    })

    it('POST /api/attendances từ chối status=MAKEUP và attendanceType không hợp lệ', async () => {
      await request(app.getHttpServer()).post('/api/attendances').send({ sessionId: 1, studentId: 2, status: 'MAKEUP' }).expect(400)
      await request(app.getHttpServer())
        .post('/api/attendances')
        .send({ sessionId: 1, studentId: 2, status: 'PRESENT', attendanceType: 'LATE' })
        .expect(400)
      expect(createAttendance).not.toHaveBeenCalled()
    })

    it('PUT /api/attendances/:id chỉ gửi attendanceType hoặc chỉ gửi status', async () => {
      await request(app.getHttpServer()).put('/api/attendances/5').send({ attendanceType: 'MAKEUP' }).expect(200)
      await request(app.getHttpServer()).put('/api/attendances/5').send({ status: 'LATE' }).expect(200)

      expect(updateAttendance.mock.calls[0][1]).toEqual({ attendanceType: 'MAKEUP' })
      expect(updateAttendance.mock.calls[1][1]).toEqual({ status: 'LATE' })
    })

    it('POST /api/attendances/bulk/session nhận attendanceType', async () => {
      await request(app.getHttpServer())
        .post('/api/attendances/bulk/session')
        .send({ sessionId: 3, attendanceType: 'MAKEUP' })
        .expect(201)

      expect(createBulk.mock.calls[0][0]).toMatchObject({ sessionId: 3, attendanceType: 'MAKEUP' })
    })
  })

  describe('makeup group', () => {
    it('GET và PUT /api/course-classes/:id/makeup-group', async () => {
      await request(app.getHttpServer()).get('/api/course-classes/151/makeup-group').expect(200)
      await request(app.getHttpServer())
        .put('/api/course-classes/151/makeup-group')
        .send({ makeupClassIds: [152, 153] })
        .expect(200)

      expect(getGroup).toHaveBeenCalledWith(151)
      expect(replaceGroup.mock.calls[0][0]).toBe(151)
      expect(replaceGroup.mock.calls[0][1]).toMatchObject({ makeupClassIds: [152, 153] })
      expect(replaceGroup.mock.calls[0][2]).toBe(9)
    })

    it('PUT cho phép mảng rỗng và từ chối body không hợp lệ', async () => {
      await request(app.getHttpServer()).put('/api/course-classes/151/makeup-group').send({ makeupClassIds: [] }).expect(200)
      await request(app.getHttpServer()).put('/api/course-classes/151/makeup-group').send({}).expect(400)
      await request(app.getHttpServer()).put('/api/course-classes/151/makeup-group').send({ makeupClassIds: [0] }).expect(400)
      await request(app.getHttpServer()).put('/api/course-classes/151/makeup-group').send({ makeupClassIds: 152 }).expect(400)
      expect(replaceGroup).toHaveBeenCalledTimes(1)
    })

    it('xung đột trả HTTP 409 với code COURSE_CLASS_MAKEUP_GROUP_CONFLICT', async () => {
      replaceGroup.mockRejectedValueOnce(
        new ConflictException('Lớp đã thuộc nhóm học bù khác', COURSE_CLASS_MAKEUP_GROUP_CONFLICT_CODE),
      )

      const response = await request(app.getHttpServer())
        .put('/api/course-classes/151/makeup-group')
        .send({ makeupClassIds: [152] })
        .expect(409)

      expect(response.body.code).toBe('COURSE_CLASS_MAKEUP_GROUP_CONFLICT')
    })

    it('không còn endpoint /makeup-options', async () => {
      await request(app.getHttpServer()).get('/api/course-classes/151/makeup-options').expect(404)
      await request(app.getHttpServer()).put('/api/course-classes/151/makeup-options').send({ makeupClassIds: [] }).expect(404)
    })
  })
})
