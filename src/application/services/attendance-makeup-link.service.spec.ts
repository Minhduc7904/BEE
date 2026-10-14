import { AttendanceStatus, AttendanceType } from '../../shared/enums'
import { isMakeupTarget, normalizeAttendanceType } from './attendance-makeup-link.service'
import { createMakeupWorld, STUDENT_ID } from './attendance-makeup-fixture-spec'

// Tuần Thứ Hai 12/10/2026: S1 (lớp 10, T3), S2 (lớp 11, T5), S3 (lớp 12, T4), S4 (lớp 11, T4 sớm), S5 (lớp 13, T6).
function setup() {
  const world = createMakeupWorld()
  world.addSession(1, 10, '2026-10-13')
  world.addSession(2, 11, '2026-10-15')
  world.addSession(3, 12, '2026-10-14')
  world.addSession(4, 11, '2026-10-14', '08:00:00')
  world.addSession(5, 13, '2026-10-16')
  return world
}

const { PRESENT, ABSENT, LATE } = AttendanceStatus
const { REGULAR, MAKEUP } = AttendanceType

describe('normalizeAttendanceType / isMakeupTarget', () => {
  it('ép ABSENT về REGULAR kể cả khi gửi MAKEUP', () => {
    expect(normalizeAttendanceType(ABSENT, MAKEUP)).toBe(REGULAR)
    expect(normalizeAttendanceType(ABSENT, undefined)).toBe(REGULAR)
  })

  it('giữ nguyên loại cho PRESENT và LATE, mặc định REGULAR', () => {
    expect(normalizeAttendanceType(PRESENT, MAKEUP)).toBe(MAKEUP)
    expect(normalizeAttendanceType(LATE, MAKEUP)).toBe(MAKEUP)
    expect(normalizeAttendanceType(PRESENT, undefined)).toBe(REGULAR)
    expect(normalizeAttendanceType(LATE, REGULAR)).toBe(REGULAR)
  })

  it('chỉ PRESENT|LATE + MAKEUP là bản ghi học bù hợp lệ', () => {
    expect(isMakeupTarget({ status: PRESENT, attendanceType: MAKEUP })).toBe(true)
    expect(isMakeupTarget({ status: LATE, attendanceType: MAKEUP })).toBe(true)
    expect(isMakeupTarget({ status: PRESENT, attendanceType: REGULAR })).toBe(false)
    expect(isMakeupTarget({ status: LATE, attendanceType: REGULAR })).toBe(false)
    expect(isMakeupTarget({ status: ABSENT, attendanceType: MAKEUP })).toBe(false)
    expect(isMakeupTarget({ status: ABSENT, attendanceType: REGULAR })).toBe(false)
  })
})

describe('AttendanceMakeupLinkService.linkAbsencesTo', () => {
  it.each([PRESENT, LATE])('%s + MAKEUP nối mọi buổi vắng chưa được bù mà buổi này học bù được', async (status) => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    const absence1 = world.seed(1, ABSENT)
    const absence3 = world.seed(3, ABSENT)
    const makeupId = world.seed(2, status, { type: MAKEUP })
    const makeup = (await world.attendanceRepository.findById(makeupId))!

    const linked = await world.linkService.linkAbsencesTo(world.repos, makeup)

    expect(linked).toBe(2)
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(makeupId)
    expect(world.get(absence3)?.makeupByAttendanceId).toBe(makeupId)
    expect(world.get(makeupId)?.attendanceType).toBe(MAKEUP)
  })

  it('bản ghi REGULAR không bao giờ tự nâng thành MAKEUP và không nối gì', async () => {
    const world = setup()
    world.pair(1, 2)
    const absence = world.seed(1, ABSENT)
    const presentId = world.seed(2, PRESENT, { type: REGULAR })
    const present = (await world.attendanceRepository.findById(presentId))!

    expect(await world.linkService.linkAbsencesTo(world.repos, present)).toBe(0)
    expect(world.get(absence)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(REGULAR)
    expect(world.attendanceRepository.update).not.toHaveBeenCalled()
  })

  it('bỏ qua buổi vắng đã được bù, bản ghi Muộn, Có mặt và học sinh khác', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    world.pair(4, 2)
    world.pair(5, 2)
    const otherMakeup = world.seed(5, PRESENT, { type: MAKEUP })
    const alreadyMadeUp = world.seed(1, ABSENT, { makeupBy: otherMakeup })
    const late = world.seed(3, LATE)
    const present = world.seed(4, PRESENT)
    const otherStudent = world.seed(1, ABSENT, { studentId: 999 })
    const makeupId = world.seed(2, PRESENT, { type: MAKEUP })
    const entity = (await world.attendanceRepository.findById(makeupId))!

    const linked = await world.linkService.linkAbsencesTo(world.repos, entity)

    expect(linked).toBe(0)
    expect(world.get(alreadyMadeUp)?.makeupByAttendanceId).toBe(otherMakeup)
    expect(world.get(late)?.makeupByAttendanceId).toBeNull()
    expect(world.get(present)?.makeupByAttendanceId).toBeNull()
    expect(world.get(otherStudent)?.makeupByAttendanceId).toBeNull()
  })
})

describe('AttendanceMakeupLinkService.linkAbsenceToMakeup', () => {
  it.each([PRESENT, LATE])('học trước, vắng sau: nối vào bản ghi %s + MAKEUP', async (status) => {
    const world = setup()
    world.pair(1, 2)
    const makeupId = world.seed(2, status, { type: MAKEUP })
    const absenceId = world.seed(1, ABSENT)
    const absence = (await world.attendanceRepository.findById(absenceId))!

    const linked = await world.linkService.linkAbsenceToMakeup(world.repos, absence)

    expect(linked).toBe(true)
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(makeupId)
    expect(absence.makeupByAttendanceId).toBe(makeupId)
  })

  it('loại candidate ABSENT, REGULAR và không đổi loại của bản ghi nào', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(1, 4)
    world.pair(1, 5)
    const regularPresent = world.seed(4, PRESENT, { type: REGULAR })
    const regularLate = world.seed(5, LATE, { type: REGULAR })
    world.seed(2, ABSENT)
    const absenceId = world.seed(1, ABSENT)

    const linked = await world.linkService.linkAbsenceToMakeup(
      world.repos,
      (await world.attendanceRepository.findById(absenceId))!,
    )

    expect(linked).toBe(false)
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(regularPresent)?.attendanceType).toBe(REGULAR)
    expect(world.get(regularLate)?.attendanceType).toBe(REGULAR)
  })

  it('chọn candidate sớm nhất theo sessionDate, startTime rồi attendanceId', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(1, 4)
    world.pair(1, 5)
    world.seed(2, PRESENT, { type: MAKEUP })
    const wednesday = world.seed(4, LATE, { type: MAKEUP })
    world.seed(5, PRESENT, { type: MAKEUP })
    const absenceId = world.seed(1, ABSENT)

    await world.linkService.linkAbsenceToMakeup(world.repos, (await world.attendanceRepository.findById(absenceId))!)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(wednesday)
  })

  it('hai candidate cùng buổi/giờ: attendanceId nhỏ hơn thắng', async () => {
    const world = setup()
    world.addSession(6, 14, '2026-10-14', '08:00:00')
    world.pair(1, 4)
    world.pair(1, 6)
    const lowerId = world.seed(6, PRESENT, { type: MAKEUP })
    const higherId = world.seed(4, PRESENT, { type: MAKEUP })
    const absenceId = world.seed(1, ABSENT)

    await world.linkService.linkAbsenceToMakeup(world.repos, (await world.attendanceRepository.findById(absenceId))!)

    // Cùng ngày và giờ bắt đầu nên attendanceId nhỏ hơn thắng
    expect(lowerId).toBeLessThan(higherId)
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(lowerId)
  })

  it('chỉ bản ghi ABSENT mới được nối; bản ghi đã được bù thì không nối lại', async () => {
    const world = setup()
    world.pair(1, 2)
    const makeupId = world.seed(2, PRESENT, { type: MAKEUP })
    const lateId = world.seed(4, LATE)
    const madeUpId = world.seed(1, ABSENT, { makeupBy: makeupId })

    expect(
      await world.linkService.linkAbsenceToMakeup(world.repos, (await world.attendanceRepository.findById(lateId))!),
    ).toBe(false)
    expect(
      await world.linkService.linkAbsenceToMakeup(world.repos, (await world.attendanceRepository.findById(madeUpId))!),
    ).toBe(false)
    expect(world.attendanceRepository.setMakeupByAttendanceId).not.toHaveBeenCalled()
  })
})

describe('AttendanceMakeupLinkService.releaseMadeUpAbsences', () => {
  it('gỡ các buổi vắng đang trỏ tới bản ghi và nối lại sang candidate hợp lệ khác nếu có', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    world.pair(1, 5)
    const makeupId = world.seed(2, PRESENT, { type: MAKEUP })
    const otherMakeup = world.seed(5, LATE, { type: MAKEUP })
    const absence1 = world.seed(1, ABSENT, { makeupBy: makeupId })
    const absence3 = world.seed(3, ABSENT, { makeupBy: makeupId })

    const released = await world.linkService.releaseMadeUpAbsences(world.repos, makeupId)

    expect(released).toBe(2)
    // Buổi 1 nối được sang bản ghi ở buổi 5; buổi 3 không còn candidate nào.
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(otherMakeup)
    expect(world.get(absence3)?.makeupByAttendanceId).toBeNull()
  })

  it('không nối lại về chính bản ghi vừa gỡ', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, PRESENT, { type: MAKEUP })
    const absenceId = world.seed(1, ABSENT, { makeupBy: presentId })

    await world.linkService.releaseMadeUpAbsences(world.repos, presentId)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
  })

  it('không nối lại sang candidate REGULAR hay ABSENT', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(1, 5)
    const presentId = world.seed(2, PRESENT, { type: MAKEUP })
    world.seed(5, PRESENT, { type: REGULAR })
    const absenceId = world.seed(1, ABSENT, { makeupBy: presentId })

    await world.linkService.releaseMadeUpAbsences(world.repos, presentId)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
  })

  it('không có buổi vắng nào trỏ tới thì không làm gì', async () => {
    const world = setup()
    const presentId = world.seed(2, PRESENT)

    expect(await world.linkService.releaseMadeUpAbsences(world.repos, presentId)).toBe(0)
    expect(world.attendanceRepository.setMakeupByAttendanceId).not.toHaveBeenCalled()
  })
})

describe('AttendanceMakeupLinkService.reconcile', () => {
  async function entity(world: ReturnType<typeof setup>, id: number) {
    return (await world.attendanceRepository.findById(id))!
  }

  it('tạo PRESENT + MAKEUP nối mọi buổi vắng hợp lệ', async () => {
    const world = setup()
    world.pair(1, 2)
    const absence = world.seed(1, ABSENT)
    const makeupId = world.seed(2, PRESENT, { type: MAKEUP })

    const result = await world.linkService.reconcile(world.repos, await entity(world, makeupId), null)

    expect(result).toEqual({ linkedAbsenceCount: 1, releasedAbsenceCount: 0 })
    expect(world.get(absence)?.makeupByAttendanceId).toBe(makeupId)
  })

  it('REGULAR được tích thành MAKEUP thì nối toàn bộ buổi vắng hợp lệ', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    const absence1 = world.seed(1, ABSENT)
    const absence3 = world.seed(3, ABSENT)
    const makeupId = world.seed(2, LATE, { type: MAKEUP })

    const result = await world.linkService.reconcile(world.repos, await entity(world, makeupId), {
      status: LATE,
      attendanceType: REGULAR,
    })

    expect(result.linkedAbsenceCount).toBe(2)
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(makeupId)
    expect(world.get(absence3)?.makeupByAttendanceId).toBe(makeupId)
  })

  it('REGULAR không tự được nâng và không nối gì', async () => {
    const world = setup()
    world.pair(1, 2)
    const absence = world.seed(1, ABSENT)
    const presentId = world.seed(2, PRESENT, { type: REGULAR })

    const result = await world.linkService.reconcile(world.repos, await entity(world, presentId), null)

    expect(result).toEqual({ linkedAbsenceCount: 0, releasedAbsenceCount: 0 })
    expect(world.get(absence)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(REGULAR)
  })

  it('PRESENT ↔ LATE khi vẫn là MAKEUP giữ nguyên các liên kết', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    const makeupId = world.seed(2, LATE, { type: MAKEUP })
    const absence1 = world.seed(1, ABSENT, { makeupBy: makeupId })
    const absence3 = world.seed(3, ABSENT)

    const result = await world.linkService.reconcile(world.repos, await entity(world, makeupId), {
      status: PRESENT,
      attendanceType: MAKEUP,
    })

    expect(result).toEqual({ linkedAbsenceCount: 0, releasedAbsenceCount: 0 })
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(makeupId)
    // Không nối thêm buổi vắng khác khi chỉ đổi PRESENT ↔ LATE
    expect(world.get(absence3)?.makeupByAttendanceId).toBeNull()
  })

  it('bỏ MAKEUP gỡ liên kết và nối lại sang candidate khác', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(1, 5)
    const otherMakeup = world.seed(5, PRESENT, { type: MAKEUP })
    const makeupId = world.seed(2, PRESENT, { type: REGULAR })
    const absence = world.seed(1, ABSENT, { makeupBy: makeupId })

    const result = await world.linkService.reconcile(world.repos, await entity(world, makeupId), {
      status: PRESENT,
      attendanceType: MAKEUP,
    })

    expect(result.releasedAbsenceCount).toBe(1)
    expect(world.get(absence)?.makeupByAttendanceId).toBe(otherMakeup)
  })

  it('MAKEUP chuyển sang ABSENT: gỡ liên kết, nối lại sang candidate khác và tự nối tới candidate nếu có', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(2, 5)
    world.pair(1, 5)
    const otherMakeup = world.seed(5, LATE, { type: MAKEUP })
    const becomingAbsentId = world.seed(2, ABSENT, { type: REGULAR })
    const absence = world.seed(1, ABSENT, { makeupBy: becomingAbsentId })

    const result = await world.linkService.reconcile(world.repos, await entity(world, becomingAbsentId), {
      status: PRESENT,
      attendanceType: MAKEUP,
    })

    expect(result.releasedAbsenceCount).toBe(1)
    expect(world.get(absence)?.makeupByAttendanceId).toBe(otherMakeup)
    // Chính bản ghi vừa thành ABSENT cũng được nối tới candidate học bù hợp lệ khác
    expect(world.get(becomingAbsentId)?.makeupByAttendanceId).toBe(otherMakeup)
    expect(world.get(becomingAbsentId)?.attendanceType).toBe(REGULAR)
  })

  it('không còn candidate thì để makeupByAttendanceId = null', async () => {
    const world = setup()
    world.pair(1, 2)
    const becomingAbsentId = world.seed(2, ABSENT)
    const absence = world.seed(1, ABSENT, { makeupBy: becomingAbsentId })

    await world.linkService.reconcile(world.repos, await entity(world, becomingAbsentId), {
      status: LATE,
      attendanceType: MAKEUP,
    })

    expect(world.get(absence)?.makeupByAttendanceId).toBeNull()
    expect(world.get(becomingAbsentId)?.makeupByAttendanceId).toBeNull()
  })

  it('bản ghi không còn là buổi vắng thì xóa liên kết "đã được bù" của chính nó', async () => {
    const world = setup()
    world.pair(1, 2)
    const makeupId = world.seed(2, PRESENT, { type: MAKEUP })
    const nowPresentId = world.seed(1, PRESENT, { makeupBy: makeupId })

    await world.linkService.reconcile(world.repos, await entity(world, nowPresentId), {
      status: ABSENT,
      attendanceType: REGULAR,
    })

    expect(world.get(nowPresentId)?.makeupByAttendanceId).toBeNull()
  })
})

describe('AttendanceMakeupLinkService.clearOwnMakeupLink', () => {
  it('xóa liên kết của chính bản ghi, bản ghi đã bù cho nó giữ nguyên Học bù', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, PRESENT, { type: MAKEUP })
    const absenceId = world.seed(1, ABSENT, { makeupBy: presentId })

    await world.linkService.clearOwnMakeupLink(world.repos, absenceId)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(MAKEUP)
    expect(world.get(absenceId)?.studentId).toBe(STUDENT_ID)
  })
})
