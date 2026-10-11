import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CopyBaseAssistantShiftsDto } from './copy-base-assistant-shifts.dto'
import { UpdateBaseAssistantShiftDto } from './update-base-assistant-shift.dto'

describe('UpdateBaseAssistantShiftDto.classId', () => {
  it('giữ nguyên null để gỡ ca khỏi lớp', async () => {
    const dto = plainToInstance(UpdateBaseAssistantShiftDto, { classId: null })

    expect(dto.classId).toBeNull()
    expect(await validate(dto)).toHaveLength(0)
  })

  it('bỏ trường classId thì giữ undefined (không đổi lớp)', async () => {
    const dto = plainToInstance(UpdateBaseAssistantShiftDto, { name: 'Ca sáng' })

    expect(dto.classId).toBeUndefined()
    expect(await validate(dto)).toHaveLength(0)
  })

  it('chấp nhận ID lớp dương và đổi chuỗi số thành số', async () => {
    const dto = plainToInstance(UpdateBaseAssistantShiftDto, { classId: '154' })

    expect(dto.classId).toBe(154)
    expect(await validate(dto)).toHaveLength(0)
  })

  it('từ chối ID lớp không dương', async () => {
    expect(await validate(plainToInstance(UpdateBaseAssistantShiftDto, { classId: 0 }))).not.toHaveLength(0)
    expect(await validate(plainToInstance(UpdateBaseAssistantShiftDto, { classId: -1 }))).not.toHaveLength(0)
  })
})

describe('CopyBaseAssistantShiftsDto.createClassSessions', () => {
  const base = { ids: [1], startPasteAt: '2026-10-12T00:00:00+07:00', endPasteAt: '2026-10-18T23:59:59+07:00' }

  it('là tùy chọn: không gửi thì hợp lệ và để undefined', async () => {
    const dto = plainToInstance(CopyBaseAssistantShiftsDto, base)

    expect(dto.createClassSessions).toBeUndefined()
    expect(await validate(dto)).toHaveLength(0)
  })

  it('chấp nhận true và false', async () => {
    expect(
      plainToInstance(CopyBaseAssistantShiftsDto, { ...base, createClassSessions: true }).createClassSessions,
    ).toBe(true)
    expect(
      plainToInstance(CopyBaseAssistantShiftsDto, { ...base, createClassSessions: false }).createClassSessions,
    ).toBe(false)
  })
})
