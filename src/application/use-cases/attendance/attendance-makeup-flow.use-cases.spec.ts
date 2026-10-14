import { AttendanceStatus, AttendanceType } from '../../../shared/enums'
import { ConflictException, ForbiddenException, NotFoundException } from '../../../shared/exceptions/custom-exceptions'
import { createMakeupWorld, STUDENT_ID } from '../../services/attendance-makeup-fixture-spec'
import { CheckInAttendanceDto } from '../../dtos/attendance/check-in-attendance.dto'
import { CreateAttendanceDto } from '../../dtos/attendance/create-attendance.dto'
import { UpdateAttendanceDto } from '../../dtos/attendance/update-attendance.dto'
import { CreateBulkAttendanceBySessionDto } from '../../dtos/attendance/create-bulk-attendance-by-session.dto'
import { CheckInAttendanceUseCase } from './check-in-attendance.use-case'
import { CancelCheckInAttendanceUseCase } from './cancel-check-in-attendance.use-case'
import { CreateAttendanceUseCase } from './create-attendance.use-case'
import { UpdateAttendanceUseCase } from './update-attendance.use-case'
import { DeleteAttendanceUseCase } from './delete-attendance.use-case'
import { CreateBulkAttendanceBySessionUseCase } from './create-bulk-attendance-by-session.use-case'

const ADMIN_ID = 1

// S1 (lớp 10, T3) và S2 (lớp 11, T5) học bù được cho nhau; S3 (lớp 12) không thuộc cặp nào.
function setup() {
  const world = createMakeupWorld()
  world.addSession(1, 10, '2026-10-13')
  world.addSession(2, 11, '2026-10-15')
  world.addSession(3, 12, '2026-10-14')
  world.addSession(5, 13, '2026-10-16')
  world.pair(1, 2)

  const sendAttendanceToParent = { executeWithRepos: jest.fn() }
  const sendBulkAttendanceToParent = { executeWithRepos: jest.fn() }
  const pointService = world.studentPointService as never
  const notifyOne = world.createAndNotifyOne as never
  const attendanceNotification = { enqueueAttendanceEvent: jest.fn().mockResolvedValue(true) }

  return {
    world,
    sendAttendanceToParent,
    sendBulkAttendanceToParent,
    attendanceNotification,
    checkIn: new CheckInAttendanceUseCase(
      world.unitOfWork,
      notifyOne,
      pointService,
      world.linkService,
      attendanceNotification as never,
    ),
    cancel: new CancelCheckInAttendanceUseCase(
      world.unitOfWork,
      notifyOne,
      pointService,
      world.linkService,
      attendanceNotification as never,
    ),
    create: new CreateAttendanceUseCase(
      world.unitOfWork,
      notifyOne,
      sendAttendanceToParent as never,
      pointService,
      world.linkService,
    ),
    update: new UpdateAttendanceUseCase(
      world.unitOfWork,
      notifyOne,
      sendAttendanceToParent as never,
      pointService,
      world.linkService,
    ),
    remove: new DeleteAttendanceUseCase(world.unitOfWork, notifyOne, pointService, world.linkService),
    bulk: new CreateBulkAttendanceBySessionUseCase(
      world.unitOfWork,
      world.createAndNotifyMany as never,
      sendBulkAttendanceToParent as never,
      pointService,
      world.linkService,
    ),
  }
}

const checkInDto = (sessionId: number, studentId = STUDENT_ID) =>
  Object.assign(new CheckInAttendanceDto(), { sessionId, studentId })

const createDto = (data: Partial<CreateAttendanceDto>) =>
  Object.assign(new CreateAttendanceDto(), { sessionId: 1, studentId: STUDENT_ID, ...data })

const updateDto = (data: Partial<UpdateAttendanceDto>) => Object.assign(new UpdateAttendanceDto(), data)

describe('CheckInAttendanceUseCase', () => {
  it('chưa có bản ghi: tạo Có mặt, loại Chính khóa khi không có buổi vắng nào để nối', async () => {
    const { world, checkIn } = setup()

    const result = await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({
      sessionId: 2,
      status: 'PRESENT',
      attendanceType: 'REGULAR',
      linkedAbsenceCount: 0,
      makeupByAttendanceId: null,
      isMadeUp: false,
    })
    expect(world.get(result.data!.attendanceId)?.status).toBe(AttendanceStatus.PRESENT)
  })

  it('check-in một học sinh còn buổi vắng bù được: bản ghi vẫn là Chính khóa và không nối gì', async () => {
    const { world, checkIn } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    const result = await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceType: 'REGULAR', linkedAbsenceCount: 0 })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(result.data!.madeUpAbsences).toEqual([])
  })

  it('Muộn + Học bù check-in sang Có mặt: giữ Học bù và giữ nguyên các liên kết', async () => {
    const { world, checkIn } = setup()
    const lateId = world.seed(2, AttendanceStatus.LATE, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: lateId })

    const result = await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceId: lateId, status: 'PRESENT', attendanceType: 'MAKEUP' })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(lateId)
  })

  it('Vắng check-in sang Có mặt luôn là Chính khóa', async () => {
    const { world, checkIn } = setup()
    const absentId = world.seed(2, AttendanceStatus.ABSENT)

    const result = await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceId: absentId, status: 'PRESENT', attendanceType: 'REGULAR' })
  })

  it('học trước, vắng sau: Có mặt + Học bù ở buổi 2 rồi bulk vắng buổi 1 thì tự nối', async () => {
    const { world, create, bulk } = setup()
    const first = await create.execute(
      createDto({ sessionId: 2, status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      ADMIN_ID,
      ADMIN_ID,
    )

    await bulk.execute(
      Object.assign(new CreateBulkAttendanceBySessionDto(), { sessionId: 1, status: AttendanceStatus.ABSENT }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(world.get(first.data!.attendanceId)?.attendanceType).toBe(AttendanceType.MAKEUP)
    const absenceRecord = [world.get(1), world.get(2)].find((record) => record?.sessionId === 1)
    expect(absenceRecord?.status).toBe(AttendanceStatus.ABSENT)
    expect(absenceRecord?.makeupByAttendanceId).toBe(first.data!.attendanceId)
  })

  it('đã Có mặt: trả nguyên trạng, không ghi lại, không trao điểm', async () => {
    const { world, checkIn } = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })

    const result = await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceId: presentId, status: 'PRESENT', attendanceType: 'MAKEUP' })
    expect(world.attendanceRepository.create).not.toHaveBeenCalled()
    expect(world.attendanceRepository.update).not.toHaveBeenCalled()
    expect(world.studentPointService.awardAttendancePoints).not.toHaveBeenCalled()
  })

  it('chuyển sang Có mặt: xếp hàng thông báo ARRIVED cho phụ huynh trong cùng transaction', async () => {
    const { world, checkIn, attendanceNotification } = setup()

    const result = await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(attendanceNotification.enqueueAttendanceEvent).toHaveBeenCalledTimes(1)
    expect(attendanceNotification.enqueueAttendanceEvent).toHaveBeenCalledWith(
      world.repos,
      expect.objectContaining({ attendanceId: result.data!.attendanceId, status: AttendanceStatus.PRESENT }),
      'ARRIVED',
    )
  })

  it('đã Có mặt từ trước (nhánh idempotent): không xếp hàng thông báo', async () => {
    const { world, checkIn, attendanceNotification } = setup()
    world.seed(2, AttendanceStatus.PRESENT)

    await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(attendanceNotification.enqueueAttendanceEvent).not.toHaveBeenCalled()
  })

  it('Vắng đã được học bù rồi điểm danh tiếp: xóa liên kết riêng, bản ghi đã bù giữ Học bù', async () => {
    const { world, checkIn } = setup()
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    const result = await checkIn.execute(checkInDto(1), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceId: absenceId, status: 'PRESENT', makeupByAttendanceId: null })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(makeupId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('Muộn chuyển sang Có mặt', async () => {
    const { world, checkIn } = setup()
    const lateId = world.seed(3, AttendanceStatus.LATE)

    const result = await checkIn.execute(checkInDto(3), ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceId: lateId, status: 'PRESENT' })
  })

  it('trao điểm, thông báo học sinh và ghi audit; không gửi tin phụ huynh', async () => {
    const { world, checkIn } = setup()

    await checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)

    expect(world.studentPointService.awardAttendancePoints).toHaveBeenCalledTimes(1)
    expect(world.createAndNotifyOne.executeWithRepos).toHaveBeenCalledTimes(1)
    expect(world.repos.adminAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ adminId: ADMIN_ID, status: 'SUCCESS' }),
    )
  })

  it('buổi học không tồn tại: NotFoundException', async () => {
    const { checkIn } = setup()

    await expect(checkIn.execute(checkInDto(999), ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('khóa học đã kết thúc: ConflictException', async () => {
    const { world, checkIn } = setup()
    world.repos.classSessionRepository.findById = jest.fn().mockResolvedValue({
      sessionId: 2,
      classId: 11,
      courseClass: { course: { isEnded: true } },
    })

    await expect(checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(ConflictException)
  })

  it('học sinh không tồn tại hoặc bị vô hiệu hóa bị từ chối', async () => {
    const { world, checkIn } = setup()
    world.repos.studentRepository.findById = jest.fn().mockResolvedValue(null)
    await expect(checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(NotFoundException)

    world.repos.studentRepository.findById = jest.fn().mockResolvedValue({ studentId: 1, user: { isActive: false } })
    await expect(checkIn.execute(checkInDto(2), ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(ForbiddenException)
  })
})

describe('CancelCheckInAttendanceUseCase', () => {
  it('Có mặt + Học bù về Vắng: ép Chính khóa và gỡ buổi vắng đã được bù', async () => {
    const { world, cancel } = setup()
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    const result = await cancel.execute(makeupId, ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({
      attendanceId: makeupId,
      status: 'ABSENT',
      attendanceType: 'REGULAR',
      linkedAbsenceCount: 1,
      isMadeUp: false,
    })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.studentPointService.awardAttendancePoints).toHaveBeenCalledWith(
      world.repos,
      expect.objectContaining({ attendanceId: makeupId, status: AttendanceStatus.ABSENT }),
    )
  })

  it('hủy điểm danh: xếp hàng thông báo STATUS_CHANGED cho phụ huynh', async () => {
    const { world, cancel, attendanceNotification } = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT)

    await cancel.execute(presentId, ADMIN_ID, ADMIN_ID)

    expect(attendanceNotification.enqueueAttendanceEvent).toHaveBeenCalledTimes(1)
    expect(attendanceNotification.enqueueAttendanceEvent).toHaveBeenCalledWith(
      world.repos,
      expect.objectContaining({ attendanceId: presentId, status: AttendanceStatus.ABSENT }),
      'STATUS_CHANGED',
    )
  })

  it('buổi vắng bị gỡ được nối lại sang bản ghi Có mặt khác của cùng học sinh', async () => {
    const { world, cancel } = setup()
    world.pair(1, 5)
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const otherId = world.seed(5, AttendanceStatus.LATE, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    await cancel.execute(makeupId, ADMIN_ID, ADMIN_ID)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(otherId)
    expect(world.get(otherId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('bản ghi vừa hủy tự nối vào candidate Có mặt + Học bù nếu có', async () => {
    const { world, cancel } = setup()
    const makeupId = world.seed(1, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const cancelledId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.REGULAR })

    // Hủy buổi 2 thì buổi 2 (Vắng) được nối vào buổi 1 đã học bù.
    const result = await cancel.execute(cancelledId, ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'ABSENT', makeupByAttendanceId: makeupId, isMadeUp: true })
    expect(world.get(makeupId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('bản ghi vừa hủy không nối vào candidate Chính khóa và không nâng nó thành Học bù', async () => {
    const { world, cancel } = setup()
    const regularId = world.seed(1, AttendanceStatus.PRESENT)
    const cancelledId = world.seed(2, AttendanceStatus.PRESENT)

    const result = await cancel.execute(cancelledId, ADMIN_ID, ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'ABSENT', makeupByAttendanceId: null, isMadeUp: false })
    expect(world.get(regularId)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('chỉ hủy được khi đang Có mặt: Vắng hoặc Muộn bị ConflictException', async () => {
    const { world, cancel } = setup()
    const absentId = world.seed(1, AttendanceStatus.ABSENT)
    const lateId = world.seed(3, AttendanceStatus.LATE)

    await expect(cancel.execute(absentId, ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(ConflictException)
    await expect(cancel.execute(lateId, ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(ConflictException)
    expect(world.attendanceRepository.update).not.toHaveBeenCalled()
  })

  it('bản ghi không tồn tại: NotFoundException', async () => {
    const { cancel } = setup()

    await expect(cancel.execute(999, ADMIN_ID, ADMIN_ID)).rejects.toBeInstanceOf(NotFoundException)
  })
})

describe('CreateAttendanceUseCase liên kết học bù', () => {
  it.each([AttendanceStatus.PRESENT, AttendanceStatus.LATE])(
    'tạo %s + Học bù nối buổi vắng bù được',
    async (status) => {
      const { world, create } = setup()
      const absenceId = world.seed(1, AttendanceStatus.ABSENT)

      const result = await create.execute(
        createDto({ sessionId: 2, status, attendanceType: AttendanceType.MAKEUP }),
        ADMIN_ID,
        ADMIN_ID,
      )

      expect(result.data).toMatchObject({ status, attendanceType: 'MAKEUP' })
      expect(world.get(absenceId)?.makeupByAttendanceId).toBe(result.data!.attendanceId)
    },
  )

  it('tạo Có mặt Chính khóa không tự thành Học bù và không nối buổi vắng', async () => {
    const { world, create } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    const result = await create.execute(
      createDto({ sessionId: 2, status: AttendanceStatus.PRESENT }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ attendanceType: 'REGULAR' })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
  })

  it('tạo Vắng + Học bù: ép về Chính khóa trước khi lưu, audit và điểm thưởng', async () => {
    const { world, create } = setup()

    const result = await create.execute(
      createDto({ sessionId: 1, status: AttendanceStatus.ABSENT, attendanceType: AttendanceType.MAKEUP }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'ABSENT', attendanceType: 'REGULAR' })
    expect(world.get(result.data!.attendanceId)?.attendanceType).toBe(AttendanceType.REGULAR)
    expect(world.attendanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ attendanceType: AttendanceType.REGULAR }),
    )
    expect(world.studentPointService.awardAttendancePoints).toHaveBeenCalledWith(
      world.repos,
      expect.objectContaining({ attendanceType: AttendanceType.REGULAR }),
    )
    expect(world.repos.adminAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ afterData: expect.objectContaining({ attendanceType: AttendanceType.REGULAR }) }),
    )
  })

  it('tạo Vắng khi đã học bù trước (Có mặt/Muộn + Học bù) thì tự được nối', async () => {
    const { world, create } = setup()
    const makeupId = world.seed(2, AttendanceStatus.LATE, { type: AttendanceType.MAKEUP })

    const result = await create.execute(
      createDto({ sessionId: 1, status: AttendanceStatus.ABSENT }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'ABSENT', makeupByAttendanceId: makeupId, isMadeUp: true })
    expect(world.get(makeupId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('tạo Vắng khi bản ghi ở buổi bù là Chính khóa thì không nối và không nâng loại', async () => {
    const { world, create } = setup()
    const regularId = world.seed(2, AttendanceStatus.PRESENT)

    const result = await create.execute(
      createDto({ sessionId: 1, status: AttendanceStatus.ABSENT }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'ABSENT', makeupByAttendanceId: null, isMadeUp: false })
    expect(world.get(regularId)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('không gửi tin phụ huynh (tạm tắt)', async () => {
    const { create, sendAttendanceToParent } = setup()

    await create.execute(createDto({ sessionId: 2, status: AttendanceStatus.PRESENT }), ADMIN_ID, ADMIN_ID)

    expect(sendAttendanceToParent.executeWithRepos).not.toHaveBeenCalled()
  })
})

describe('CreateBulkAttendanceBySessionUseCase liên kết học bù', () => {
  it('tạo Có mặt + Học bù hàng loạt nối các buổi vắng chưa được bù của học sinh', async () => {
    const { world, bulk } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    const result = await bulk.execute(
      Object.assign(new CreateBulkAttendanceBySessionDto(), {
        sessionId: 2,
        status: AttendanceStatus.PRESENT,
        attendanceType: AttendanceType.MAKEUP,
      }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data).toHaveLength(1)
    expect(result.data![0]).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP' })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(result.data![0].attendanceId)
  })

  it('tạo Có mặt hàng loạt không có loại thì là Chính khóa và không nối', async () => {
    const { world, bulk } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    const result = await bulk.execute(
      Object.assign(new CreateBulkAttendanceBySessionDto(), { sessionId: 2, status: AttendanceStatus.PRESENT }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data![0]).toMatchObject({ status: 'PRESENT', attendanceType: 'REGULAR' })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
  })

  it('tạo Vắng + Học bù hàng loạt: ép Chính khóa', async () => {
    const { bulk } = setup()

    const result = await bulk.execute(
      Object.assign(new CreateBulkAttendanceBySessionDto(), {
        sessionId: 1,
        status: AttendanceStatus.ABSENT,
        attendanceType: AttendanceType.MAKEUP,
      }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data![0]).toMatchObject({ status: 'ABSENT', attendanceType: 'REGULAR' })
  })

  it('tạo vắng hàng loạt tự nối với bản ghi Học bù đã học ở buổi học bù', async () => {
    const { world, bulk, sendBulkAttendanceToParent } = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })

    const result = await bulk.execute(
      Object.assign(new CreateBulkAttendanceBySessionDto(), { sessionId: 1, status: AttendanceStatus.ABSENT }),
      ADMIN_ID,
      ADMIN_ID,
    )

    expect(result.data).toHaveLength(1)
    expect(result.data![0]).toMatchObject({ status: 'ABSENT', makeupByAttendanceId: presentId, isMadeUp: true })
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.MAKEUP)
    expect(sendBulkAttendanceToParent.executeWithRepos).not.toHaveBeenCalled()
  })
})

describe('UpdateAttendanceUseCase (PUT) liên kết học bù', () => {
  it('Vắng đã được bù đổi sang Có mặt: xóa liên kết riêng, bản ghi bù giữ Học bù', async () => {
    const { world, update } = setup()
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    const result = await update.execute(absenceId, updateDto({ status: AttendanceStatus.PRESENT }), ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'PRESENT', makeupByAttendanceId: null })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(makeupId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('Vắng đổi sang Có mặt không có loại: là Chính khóa, không nối các buổi vắng khác', async () => {
    const { world, update } = setup()
    const absence1 = world.seed(1, AttendanceStatus.ABSENT)
    const absence2 = world.seed(2, AttendanceStatus.ABSENT)

    const result = await update.execute(absence2, updateDto({ status: AttendanceStatus.PRESENT }), ADMIN_ID)

    expect(result.data).toMatchObject({ attendanceType: 'REGULAR' })
    expect(world.get(absence1)?.makeupByAttendanceId).toBeNull()
  })

  it('Có mặt + Học bù đổi sang Vắng: ép Chính khóa, gỡ buổi vắng đã bù và nối lại sang candidate khác', async () => {
    const { world, update } = setup()
    world.pair(1, 5)
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const otherId = world.seed(5, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })

    const result = await update.execute(
      presentId,
      updateDto({ status: AttendanceStatus.ABSENT, attendanceType: AttendanceType.MAKEUP }),
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'ABSENT', attendanceType: 'REGULAR' })
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.REGULAR)
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(otherId)
    expect(world.studentPointService.awardAttendancePoints).toHaveBeenCalledWith(
      world.repos,
      expect.objectContaining({ status: AttendanceStatus.ABSENT, attendanceType: AttendanceType.REGULAR }),
    )
  })

  it('Có mặt + Học bù đổi sang Vắng mà không còn candidate: buổi vắng quay về chưa được bù', async () => {
    const { world, update } = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })

    await update.execute(presentId, updateDto({ status: AttendanceStatus.ABSENT }), ADMIN_ID)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.status).toBe(AttendanceStatus.ABSENT)
  })

  it('Vắng gửi attendanceType = MAKEUP mà không đổi trạng thái: vẫn là Chính khóa, không đổi dữ liệu', async () => {
    const { world, update } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    const result = await update.execute(
      absenceId,
      updateDto({ attendanceType: AttendanceType.MAKEUP }),
      undefined,
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'ABSENT', attendanceType: 'REGULAR' })
    expect(world.attendanceRepository.update).not.toHaveBeenCalled()
  })

  it('Có mặt + Học bù đổi sang Muộn: giữ Học bù và giữ nguyên các liên kết', async () => {
    const { world, update } = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })

    const result = await update.execute(presentId, updateDto({ status: AttendanceStatus.LATE }), ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'LATE', attendanceType: 'MAKEUP' })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(presentId)
  })

  it('đổi loại về Chính khóa gỡ mọi buổi vắng đang trỏ tới và không nối lại về chính nó', async () => {
    const { world, update } = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })

    const result = await update.execute(presentId, updateDto({ attendanceType: AttendanceType.REGULAR }), ADMIN_ID)

    expect(result.data).toMatchObject({ status: 'PRESENT', attendanceType: 'REGULAR' })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('đổi loại sang Học bù khi đang Có mặt thì nối các buổi vắng', async () => {
    const { world, update } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)
    const presentId = world.seed(2, AttendanceStatus.PRESENT)

    await update.execute(presentId, updateDto({ attendanceType: AttendanceType.MAKEUP }), ADMIN_ID)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(presentId)
  })

  it('đổi cùng lúc Vắng sang Có mặt và loại Học bù: nối các buổi vắng khác', async () => {
    const { world, update } = setup()
    const absence1 = world.seed(1, AttendanceStatus.ABSENT)
    const absence2 = world.seed(2, AttendanceStatus.ABSENT)

    const result = await update.execute(
      absence2,
      updateDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP', makeupByAttendanceId: null })
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(absence2)
  })

  it('đổi cùng lúc Vắng sang Có mặt và loại Chính khóa: không nối', async () => {
    const { world, update } = setup()
    const absence1 = world.seed(1, AttendanceStatus.ABSENT)
    const absence2 = world.seed(2, AttendanceStatus.ABSENT)

    const result = await update.execute(
      absence2,
      updateDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.REGULAR }),
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'PRESENT', attendanceType: 'REGULAR' })
    expect(world.get(absence1)?.makeupByAttendanceId).toBeNull()
  })

  it('đổi cùng lúc Vắng đã được bù sang Có mặt và Học bù: xóa liên kết riêng, giữ Học bù', async () => {
    const { world, update } = setup()
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    const result = await update.execute(
      absenceId,
      updateDto({ status: AttendanceStatus.PRESENT, attendanceType: AttendanceType.MAKEUP }),
      ADMIN_ID,
    )

    expect(result.data).toMatchObject({ status: 'PRESENT', attendanceType: 'MAKEUP', makeupByAttendanceId: null })
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(makeupId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('không gửi tin phụ huynh (tạm tắt)', async () => {
    const { world, update, sendAttendanceToParent } = setup()
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    await update.execute(absenceId, updateDto({ status: AttendanceStatus.PRESENT }), ADMIN_ID)

    expect(sendAttendanceToParent.executeWithRepos).not.toHaveBeenCalled()
  })
})

describe('DeleteAttendanceUseCase liên kết học bù', () => {
  it('xóa bản ghi Có mặt: buổi vắng đang trỏ tới được nối lại sang bản ghi khác', async () => {
    const { world, remove } = setup()
    world.pair(1, 5)
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const otherId = world.seed(5, AttendanceStatus.LATE, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    await remove.execute(makeupId, ADMIN_ID)

    expect(world.get(makeupId)).toBeUndefined()
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(otherId)
    expect(world.get(otherId)?.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('xóa bản ghi Có mặt + Học bù: không nối lại sang candidate Chính khóa', async () => {
    const { world, remove } = setup()
    world.pair(1, 5)
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const regularId = world.seed(5, AttendanceStatus.PRESENT)
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    await remove.execute(makeupId, ADMIN_ID)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(regularId)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('xóa bản ghi Có mặt mà không còn bản ghi khác thì buổi vắng quay về chưa được bù', async () => {
    const { world, remove } = setup()
    const makeupId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: makeupId })

    await remove.execute(makeupId, ADMIN_ID)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
  })
})
