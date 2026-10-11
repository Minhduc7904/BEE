import { AttendanceSessionNotificationTemplate as Template } from './attendance-session-notification.template'

const base = {
  studentName: 'Nguyễn Văn A',
  className: 'Toán 9A',
  sessionName: 'Buổi 3',
  sessionDate: '14/10/2026',
  sessionTime: '18:00 - 20:00',
}

describe('AttendanceSessionNotificationTemplate', () => {
  it('renderNotArrived: nêu mốc giờ và học sinh', () => {
    const result = Template.renderNotArrived({ ...base, reminderTime: '18:15' })
    expect(result.title).toBe('Thông báo điểm danh')
    expect(result.parentMessage).toContain('HỌC SINH: Nguyễn Văn A')
    expect(result.parentMessage).toContain('LỚP: Toán 9A')
    expect(result.parentMessage).toContain('NGÀY HỌC: 14/10/2026 (18:00 - 20:00)')
    expect(result.parentMessage).toContain('Đến 18:15 con chưa có mặt tại lớp.')
    expect(result.studentMessage).toBe('Bạn chưa có mặt ở buổi Buổi 3 lớp Toán 9A.')
  })

  it('renderAbsent: có dòng lịch học bù khi có ghi chú', () => {
    const withNote = Template.renderAbsent({ ...base, makeupNote: ' Thứ 6 18:00 ' })
    expect(withNote.parentMessage).toContain('Hôm nay con vắng buổi học Buổi 3.')
    expect(withNote.parentMessage).toContain('🔁 LỊCH HỌC BÙ: Thứ 6 18:00')
    expect(withNote.studentMessage).toBe('Bạn đã vắng buổi Buổi 3 lớp Toán 9A.')
  })

  it('renderAbsent: không có ghi chú thì bỏ dòng lịch học bù', () => {
    expect(Template.renderAbsent({ ...base, makeupNote: null }).parentMessage).not.toContain('LỊCH HỌC BÙ')
    expect(Template.renderAbsent({ ...base, makeupNote: '  ' }).parentMessage).not.toContain('LỊCH HỌC BÙ')
  })

  it('renderArrived: thêm (học bù) khi là bản ghi học bù', () => {
    expect(Template.renderArrived({ ...base, markedAt: '18:05' }).parentMessage).toContain('Con đã đến lớp lúc 18:05.')
    expect(Template.renderArrived({ ...base, markedAt: '18:05', isMakeup: true }).parentMessage).toContain(
      'Con đã đến lớp lúc 18:05 (học bù).',
    )
  })

  it('renderStatusChanged: nêu nhãn trạng thái', () => {
    const result = Template.renderStatusChanged({ ...base, statusLabel: 'Vắng mặt' })
    expect(result.parentMessage).toContain('Trạng thái điểm danh đã được cập nhật: Vắng mặt.')
    expect(result.studentMessage).toContain('Vắng mặt')
  })

  it('bỏ giờ học trong ngày khi không có sessionTime', () => {
    const result = Template.renderAbsent({ ...base, sessionTime: undefined })
    expect(result.parentMessage).toContain('NGÀY HỌC: 14/10/2026\n')
  })
})
