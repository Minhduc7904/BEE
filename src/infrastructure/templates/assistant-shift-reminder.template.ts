export interface AssistantShiftReminderTemplateData {
  recipientName: string
  shiftName: string
  shiftNotes: string | null
  startAt: Date
  endAt: Date
  checkInUrl: string
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatDateTime = (date: Date): string =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)

const formatTimeRange = (startAt: Date, endAt: Date): string => {
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${formatter.format(startAt)} - ${formatter.format(endAt)}`
}

export function createAssistantShiftReminderTemplate(data: AssistantShiftReminderTemplateData): {
  subject: string
  html: string
  text: string
} {
  const subject = `${formatTimeRange(data.startAt, data.endAt)} ${data.shiftName} - Bạn có lịch đi trợ giảng`
  const recipientName = escapeHtml(data.recipientName || 'Trợ giảng')
  const shiftName = escapeHtml(data.shiftName)
  const shiftNotes = data.shiftNotes?.trim() ?? ''
  const escapedShiftNotes = escapeHtml(shiftNotes)
  const checkInUrl = escapeHtml(data.checkInUrl)
  const startAt = formatDateTime(data.startAt)
  const endAt = formatDateTime(data.endAt)

  return {
    subject,
    html: `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#172033">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="padding:28px 32px;background:#155eef;color:#fff"><h1 style="margin:0;font-size:22px">Nhắc lịch trợ giảng</h1></div>
    <div style="padding:28px 32px;font-size:16px;line-height:1.6">
      <p>Xin chào <strong>${recipientName}</strong>,</p>
      <p>Bạn sắp có lịch trợ giảng. Vui lòng đến lớp trước <strong>30 phút</strong> để chuẩn bị.</p>
      <div style="padding:16px;background:#f2f4f7;border-radius:8px">
        <div><strong>Ca:</strong> ${shiftName}</div>
        <div><strong>Bắt đầu:</strong> ${startAt}</div>
        <div><strong>Kết thúc:</strong> ${endAt}</div>
      </div>
      ${
        shiftNotes
          ? `<div style="margin-top:20px;padding:18px;background:#fff7ed;border:2px solid #f79009;border-radius:8px">
        <div style="margin-bottom:8px;font-size:14px;font-weight:700;color:#9a6700;text-transform:uppercase">Lưu ý công việc cần làm</div>
        <div style="white-space:pre-wrap;font-size:18px;font-weight:700;line-height:1.55;color:#7a271a">${escapedShiftNotes}</div>
      </div>`
          : ''
      }
      <p style="text-align:center;margin:28px 0"><a href="${checkInUrl}" style="display:inline-block;padding:13px 24px;background:#155eef;color:#fff;text-decoration:none;border-radius:7px;font-weight:700">Điểm danh</a></p>
      <p style="font-size:13px;color:#667085">Nếu không thể nhìn thấy nút điểm danh, hãy <a href="${checkInUrl}">ấn vào link điểm danh này</a>.</p>
      <p style="font-size:13px;color:#667085">Nút điểm danh chỉ dùng được từ 45 phút trước giờ bắt đầu đến hết ca.</p>
    </div>
  </div>
</body></html>`,
    text: `Xin chào ${data.recipientName},\n\nBạn sắp có lịch trợ giảng "${data.shiftName}". Vui lòng đến lớp trước 30 phút.\nBắt đầu: ${startAt}\nKết thúc: ${endAt}${shiftNotes ? `\n\nLƯU Ý CÔNG VIỆC CẦN LÀM:\n${shiftNotes}` : ''}\n\nĐiểm danh: ${data.checkInUrl}`,
  }
}

export function createAssistantShiftCheckInSuccessTemplate(
  data: Omit<AssistantShiftReminderTemplateData, 'checkInUrl' | 'shiftNotes'>,
): { subject: string; html: string; text: string } {
  const subject = `Đã điểm danh thành công - ${data.shiftName}`
  const recipientName = escapeHtml(data.recipientName || 'Trợ giảng')
  const shiftName = escapeHtml(data.shiftName)
  const startAt = formatDateTime(data.startAt)
  const endAt = formatDateTime(data.endAt)

  return {
    subject,
    html: `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#172033">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="padding:28px 32px;background:#16a34a;color:#fff"><h1 style="margin:0;font-size:22px">Điểm danh thành công</h1></div>
    <div style="padding:28px 32px;font-size:16px;line-height:1.6">
      <p>Xin chào <strong>${recipientName}</strong>,</p>
      <p>Hệ thống đã ghi nhận bạn đi làm ca trợ giảng sau:</p>
      <div style="padding:16px;background:#ecfdf3;border-radius:8px">
        <div><strong>Ca:</strong> ${shiftName}</div>
        <div><strong>Bắt đầu:</strong> ${startAt}</div>
        <div><strong>Kết thúc:</strong> ${endAt}</div>
      </div>
    </div>
  </div>
</body></html>`,
    text: `Xin chào ${data.recipientName},\n\nHệ thống đã ghi nhận bạn điểm danh thành công cho ca "${data.shiftName}".\nBắt đầu: ${startAt}\nKết thúc: ${endAt}`,
  }
}

export function createAssistantShiftAbsenceNotificationTemplate(
  data: Omit<AssistantShiftReminderTemplateData, 'checkInUrl' | 'shiftNotes'>,
): { subject: string; html: string; text: string } {
  const subject = `${formatTimeRange(data.startAt, data.endAt)} ${data.shiftName} - Bạn không đi làm ca này`
  const recipientName = escapeHtml(data.recipientName || 'Trợ giảng')
  const shiftName = escapeHtml(data.shiftName)
  const startAt = formatDateTime(data.startAt)
  const endAt = formatDateTime(data.endAt)

  return {
    subject,
    html: `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#fff7ed;font-family:Arial,sans-serif;color:#431407">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="padding:28px 32px;background:#c2410c;color:#fff"><h1 style="margin:0;font-size:22px">Thông báo vắng ca trợ giảng</h1></div>
    <div style="padding:28px 32px;font-size:16px;line-height:1.6">
      <p>Xin chào <strong>${recipientName}</strong>,</p>
      <p>Hệ thống không nhận được điểm danh của bạn trước khi ca kết thúc, nên ca sau đã được ghi nhận là <strong>không đi làm</strong>.</p>
      <div style="padding:16px;background:#fff7ed;border-radius:8px">
        <div><strong>Ca:</strong> ${shiftName}</div><div><strong>Bắt đầu:</strong> ${startAt}</div><div><strong>Kết thúc:</strong> ${endAt}</div>
      </div>
      <p>Nếu đây là nhầm lẫn, vui lòng liên hệ quản lý để được hỗ trợ.</p>
    </div>
  </div>
</body></html>`,
    text: `Xin chào ${data.recipientName},\n\nCa trợ giảng "${data.shiftName}" (${startAt} - ${endAt}) đã được ghi nhận không đi làm vì chưa điểm danh trước khi ca kết thúc. Nếu có nhầm lẫn, vui lòng liên hệ quản lý.`,
  }
}
