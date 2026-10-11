export interface AttendanceSessionNotificationData {
  studentName: string
  className: string
  /** Tên buổi học. */
  sessionName: string
  /** Ngày học dạng dd/MM/yyyy (giờ VN). */
  sessionDate: string
  /** Giờ học dạng "HH:mm - HH:mm" (giờ VN), bỏ trống nếu không có. */
  sessionTime?: string
}

export interface AttendanceSessionNotificationContent {
  title: string
  parentMessage: string
  studentMessage: string
}

const TITLE = 'Thông báo điểm danh'

/**
 * Nội dung thông báo điểm danh theo buổi học. Thuần (không phụ thuộc DB/Nest) để dễ chỉnh sửa và kiểm thử.
 * Phụ huynh nhận tin dài có đầu mục; học sinh nhận một câu ngắn.
 */
export class AttendanceSessionNotificationTemplate {
  /** Mốc start + 15 phút: học sinh chưa có mặt. */
  static renderNotArrived(
    data: AttendanceSessionNotificationData & { reminderTime: string },
  ): AttendanceSessionNotificationContent {
    return {
      title: TITLE,
      parentMessage: this.build(data, `📌 Đến ${data.reminderTime} con chưa có mặt tại lớp.`),
      studentMessage: `Bạn chưa có mặt ở buổi ${data.sessionName} lớp ${data.className}.`,
    }
  }

  /** Mốc hết giờ: học sinh vắng, chưa học bù. */
  static renderAbsent(
    data: AttendanceSessionNotificationData & { makeupNote?: string | null },
  ): AttendanceSessionNotificationContent {
    const makeupNote = data.makeupNote?.trim()
    return {
      title: TITLE,
      parentMessage: this.build(
        data,
        `📌 Hôm nay con vắng buổi học ${data.sessionName}.`,
        makeupNote ? `🔁 LỊCH HỌC BÙ: ${makeupNote}` : '',
      ),
      studentMessage: `Bạn đã vắng buổi ${data.sessionName} lớp ${data.className}.`,
    }
  }

  /** Check-in thành Có mặt. `markedAt` là giờ điểm danh dạng "HH:mm" hoặc "HH:mm dd/MM/yyyy". */
  static renderArrived(
    data: AttendanceSessionNotificationData & { markedAt: string; isMakeup?: boolean },
  ): AttendanceSessionNotificationContent {
    return {
      title: TITLE,
      parentMessage: this.build(data, `✅ Con đã đến lớp lúc ${data.markedAt}${data.isMakeup ? ' (học bù)' : ''}.`),
      studentMessage: `Bạn đã được điểm danh có mặt lúc ${data.markedAt}.`,
    }
  }

  /** Điểm danh bị hủy / đổi trạng thái. */
  static renderStatusChanged(
    data: AttendanceSessionNotificationData & { statusLabel: string },
  ): AttendanceSessionNotificationContent {
    return {
      title: TITLE,
      parentMessage: this.build(data, `🔄 Trạng thái điểm danh đã được cập nhật: ${data.statusLabel}.`),
      studentMessage: `Điểm danh của bạn đã được cập nhật thành: ${data.statusLabel}.`,
    }
  }

  private static build(data: AttendanceSessionNotificationData, ...bodyLines: string[]): string {
    return [
      '📢 THÔNG BÁO ĐIỂM DANH',
      '━━━━━━━━━━━━━━━',
      `👨‍🎓 HỌC SINH: ${data.studentName}`,
      `🏫 LỚP: ${data.className}`,
      `📖 BUỔI HỌC: ${data.sessionName}`,
      `📅 NGÀY HỌC: ${data.sessionDate}${data.sessionTime ? ` (${data.sessionTime})` : ''}`,
      ...bodyLines,
    ]
      .filter(Boolean)
      .join('\n')
  }
}
