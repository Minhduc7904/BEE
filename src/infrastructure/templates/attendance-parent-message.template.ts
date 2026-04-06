export interface AttendanceParentMessageTemplateData {
  studentName: string
  className: string
  sessionDate: string
  sessionTime?: string
  attendanceTimeLabel: string
  arrivalTime: string
  statusLabel: string
  makeupLine?: string
  homeworkLine?: string
  notes?: string
  note?: string
}

export class AttendanceParentMessageTemplate {
  static render(data: AttendanceParentMessageTemplateData): string {
    const messageLines = [
      '📢 THÔNG BÁO ĐIỂM DANH',
      '━━━━━━━━━━━━━━━',
      `👨‍🎓 HỌC SINH: ${data.studentName}`,
      `🏫 LỚP: ${data.className}`,
      `📅 NGÀY HỌC: ${data.sessionDate}${data.sessionTime ? ` (${data.sessionTime})` : ''}`,
      `${data.attendanceTimeLabel}: ${data.arrivalTime}`,
      `📌 TRẠNG THÁI: ${data.statusLabel}`,
      data.makeupLine || '',
      data.homeworkLine || '',
      data.notes ? `📝 GHI CHÚ: ${data.notes}` : '',
      data.note ? `📎 NOTE: ${data.note}` : '',
    ].filter(Boolean)

    return messageLines.join('\n')
  }
}
