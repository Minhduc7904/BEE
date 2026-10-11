import { AttendanceStatus, AttendanceType } from '../../shared/enums'
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

describe('AttendanceMakeupLinkService.linkAbsencesTo', () => {
  it('điểm danh có mặt nối mọi buổi vắng chưa được bù mà buổi này học bù được và đổi sang Học bù', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    const absence1 = world.seed(1, AttendanceStatus.ABSENT)
    const absence3 = world.seed(3, AttendanceStatus.ABSENT)
    const presentId = world.seed(2, AttendanceStatus.PRESENT)
    const present = (await world.attendanceRepository.findById(presentId))!

    const linked = await world.linkService.linkAbsencesTo(world.repos, present)

    expect(linked).toBe(2)
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(presentId)
    expect(world.get(absence3)?.makeupByAttendanceId).toBe(presentId)
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.MAKEUP)
    expect(present.attendanceType).toBe(AttendanceType.MAKEUP)
  })

  it('không có buổi vắng nào để nối thì giữ nguyên loại Chính khóa', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, AttendanceStatus.PRESENT)
    const present = (await world.attendanceRepository.findById(presentId))!

    const linked = await world.linkService.linkAbsencesTo(world.repos, present)

    expect(linked).toBe(0)
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.REGULAR)
    expect(world.attendanceRepository.update).not.toHaveBeenCalled()
  })

  it('bỏ qua buổi vắng đã được bản ghi khác bù, bản ghi Muộn, bản ghi Có mặt và học sinh khác', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    world.pair(4, 2)
    world.pair(5, 2)
    const otherPresent = world.seed(5, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const alreadyMadeUp = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: otherPresent })
    const late = world.seed(3, AttendanceStatus.LATE)
    const present = world.seed(4, AttendanceStatus.PRESENT)
    const otherStudent = world.seed(1, AttendanceStatus.ABSENT, { studentId: 999 })
    const presentId = world.seed(2, AttendanceStatus.PRESENT)
    const entity = (await world.attendanceRepository.findById(presentId))!

    const linked = await world.linkService.linkAbsencesTo(world.repos, entity)

    expect(linked).toBe(0)
    expect(world.get(alreadyMadeUp)?.makeupByAttendanceId).toBe(otherPresent)
    expect(world.get(late)?.makeupByAttendanceId).toBeNull()
    expect(world.get(present)?.makeupByAttendanceId).toBeNull()
    expect(world.get(otherStudent)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('bản ghi không phải Có mặt (Muộn) không tham gia liên kết', async () => {
    const world = setup()
    world.pair(1, 2)
    const absence = world.seed(1, AttendanceStatus.ABSENT)
    const lateId = world.seed(2, AttendanceStatus.LATE)
    const late = (await world.attendanceRepository.findById(lateId))!

    expect(await world.linkService.linkAbsencesTo(world.repos, late)).toBe(0)
    expect(world.get(absence)?.makeupByAttendanceId).toBeNull()
  })
})

describe('AttendanceMakeupLinkService.linkAbsenceToMakeup', () => {
  it('học trước, vắng sau: bản ghi vắng được nối vào bản ghi Có mặt và bản ghi đó thành Học bù', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, AttendanceStatus.PRESENT)
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)
    const absence = (await world.attendanceRepository.findById(absenceId))!

    const linked = await world.linkService.linkAbsenceToMakeup(world.repos, absence)

    expect(linked).toBe(true)
    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(presentId)
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.MAKEUP)
    expect(absence.makeupByAttendanceId).toBe(presentId)
  })

  it('ưu tiên bản ghi đã là Học bù, sau đó là bản ghi sớm nhất', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(1, 4)
    world.pair(1, 5)
    const earliest = world.seed(4, AttendanceStatus.PRESENT)
    const latest = world.seed(5, AttendanceStatus.PRESENT)
    const makeup = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    await world.linkService.linkAbsenceToMakeup(world.repos, (await world.attendanceRepository.findById(absenceId))!)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(makeup)
    expect(world.get(earliest)?.attendanceType).toBe(AttendanceType.REGULAR)
    expect(world.get(latest)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('không có bản ghi Học bù thì chọn bản ghi sớm nhất theo ngày học', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(1, 4)
    const thursday = world.seed(2, AttendanceStatus.PRESENT)
    const wednesday = world.seed(4, AttendanceStatus.PRESENT)
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)

    await world.linkService.linkAbsenceToMakeup(world.repos, (await world.attendanceRepository.findById(absenceId))!)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBe(wednesday)
    expect(world.get(wednesday)?.attendanceType).toBe(AttendanceType.MAKEUP)
    expect(world.get(thursday)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('bản ghi Muộn không được chọn làm bản ghi học bù và bản ghi vắng Muộn không tự nối', async () => {
    const world = setup()
    world.pair(1, 2)
    world.seed(2, AttendanceStatus.LATE)
    const absenceId = world.seed(1, AttendanceStatus.ABSENT)
    const lateId = world.seed(4, AttendanceStatus.LATE)
    world.pair(4, 2)

    const absence = (await world.attendanceRepository.findById(absenceId))!
    const lateEntity = (await world.attendanceRepository.findById(lateId))!

    expect(await world.linkService.linkAbsenceToMakeup(world.repos, absence)).toBe(false)
    expect(await world.linkService.linkAbsenceToMakeup(world.repos, lateEntity)).toBe(false)
    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
  })

  it('bản ghi vắng đã được bù thì không nối lại', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, AttendanceStatus.PRESENT)
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })
    const absence = (await world.attendanceRepository.findById(absenceId))!

    expect(await world.linkService.linkAbsenceToMakeup(world.repos, absence)).toBe(false)
    expect(world.attendanceRepository.setMakeupByAttendanceId).not.toHaveBeenCalled()
  })
})

describe('AttendanceMakeupLinkService.releaseMadeUpAbsences', () => {
  it('gỡ các buổi vắng đang trỏ tới bản ghi và nối lại sang bản ghi Có mặt khác nếu có', async () => {
    const world = setup()
    world.pair(1, 2)
    world.pair(3, 2)
    world.pair(1, 5)
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const otherPresent = world.seed(5, AttendanceStatus.PRESENT)
    const absence1 = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })
    const absence3 = world.seed(3, AttendanceStatus.ABSENT, { makeupBy: presentId })

    const released = await world.linkService.releaseMadeUpAbsences(world.repos, presentId)

    expect(released).toBe(2)
    // Buổi 1 nối được sang bản ghi ở buổi 5; buổi 3 không còn bản ghi nào để nối.
    expect(world.get(absence1)?.makeupByAttendanceId).toBe(otherPresent)
    expect(world.get(otherPresent)?.attendanceType).toBe(AttendanceType.MAKEUP)
    expect(world.get(absence3)?.makeupByAttendanceId).toBeNull()
  })

  it('không nối lại về chính bản ghi vừa gỡ dù nó vẫn là Có mặt (đổi loại về Chính khóa)', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.REGULAR })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })

    await world.linkService.releaseMadeUpAbsences(world.repos, presentId)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.REGULAR)
  })

  it('không có buổi vắng nào trỏ tới thì không làm gì', async () => {
    const world = setup()
    const presentId = world.seed(2, AttendanceStatus.PRESENT)

    expect(await world.linkService.releaseMadeUpAbsences(world.repos, presentId)).toBe(0)
    expect(world.attendanceRepository.setMakeupByAttendanceId).not.toHaveBeenCalled()
  })
})

describe('AttendanceMakeupLinkService.clearOwnMakeupLink', () => {
  it('xóa liên kết của chính bản ghi, bản ghi đã bù cho nó giữ nguyên Học bù', async () => {
    const world = setup()
    world.pair(1, 2)
    const presentId = world.seed(2, AttendanceStatus.PRESENT, { type: AttendanceType.MAKEUP })
    const absenceId = world.seed(1, AttendanceStatus.ABSENT, { makeupBy: presentId })

    await world.linkService.clearOwnMakeupLink(world.repos, absenceId)

    expect(world.get(absenceId)?.makeupByAttendanceId).toBeNull()
    expect(world.get(presentId)?.attendanceType).toBe(AttendanceType.MAKEUP)
    expect(world.get(absenceId)?.studentId).toBe(STUDENT_ID)
  })
})
