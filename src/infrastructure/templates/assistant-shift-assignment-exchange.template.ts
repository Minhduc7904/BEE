interface AssistantShiftExchangeTemplateBase {
  recipientName: string
  requesterName: string
  shiftName: string
  startAt: Date
  endAt: Date
}

interface AssistantShiftSwapTemplateData extends AssistantShiftExchangeTemplateBase {
  sourceShiftName: string
  sourceStartAt: Date
  sourceEndAt: Date
  acceptUrl: string
  declineUrl: string
}

interface AssistantShiftTransferTemplateData extends AssistantShiftExchangeTemplateBase {
  acceptUrl: string
  declineUrl: string
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

const shiftDetail = (name: string, startAt: Date, endAt: Date): string => `
  <div style="padding:16px;background:#f2f4f7;border-radius:8px;margin:12px 0">
    <div><strong>Ca:</strong> ${escapeHtml(name)}</div>
    <div><strong>Bắt đầu:</strong> ${formatDateTime(startAt)}</div>
    <div><strong>Kết thúc:</strong> ${formatDateTime(endAt)}</div>
  </div>`

const actionButtons = (acceptUrl: string, declineUrl: string): string => `
  <p style="display:flex;gap:12px;justify-content:center;margin:28px 0">
    <a href="${escapeHtml(acceptUrl)}" style="display:inline-block;padding:13px 22px;background:#16a34a;color:#fff;text-decoration:none;border-radius:7px;font-weight:700">Xác nhận</a>
    <a href="${escapeHtml(declineUrl)}" style="display:inline-block;padding:13px 22px;background:#dc2626;color:#fff;text-decoration:none;border-radius:7px;font-weight:700">Từ chối</a>
  </p>`

const actionFallbackLinks = (acceptUrl: string, declineUrl: string): string => `
  <p style="font-size:13px;color:#667085">Nếu không thể nhìn thấy nút, hãy ấn vào link: <a href="${escapeHtml(acceptUrl)}">Xác nhận</a> hoặc <a href="${escapeHtml(declineUrl)}">Từ chối</a>.</p>`

const wrapEmail = (title: string, content: string): string => `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f6f8fb;font-family:Arial,sans-serif;color:#172033">
    <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="padding:28px 32px;background:#155eef;color:#fff">
        <h1 style="margin:0;font-size:22px">${escapeHtml(title)}</h1>
      </div>
      <div style="padding:28px 32px;font-size:16px;line-height:1.6">${content}</div>
    </div>
  </body>
</html>`

export function createAssistantShiftSwapRequestTemplate(data: AssistantShiftSwapTemplateData): {
  subject: string
  html: string
  text: string
} {
  const subject = `${data.requesterName} muốn đổi ca với bạn`
  const html = wrapEmail(
    'Xác nhận đổi ca trợ giảng',
    `
      <p>Xin chào <strong>${escapeHtml(data.recipientName)}</strong>,</p>
      <p><strong>${escapeHtml(data.requesterName)}</strong> muốn đổi ca trợ giảng với bạn.</p>
      <p>Ca của bạn sẽ đổi thành:</p>
      ${shiftDetail(data.sourceShiftName, data.sourceStartAt, data.sourceEndAt)}
      <p>Ca hiện tại của bạn:</p>
      ${shiftDetail(data.shiftName, data.startAt, data.endAt)}
      ${actionButtons(data.acceptUrl, data.declineUrl)}
      ${actionFallbackLinks(data.acceptUrl, data.declineUrl)}
      <p style="font-size:13px;color:#667085">Liên kết chỉ dùng được khi cả hai assignment đang chờ và các ca chưa kết thúc.</p>`,
  )

  return {
    subject,
    html,
    text: `${data.requesterName} muốn đổi ca với bạn. Xác nhận: ${data.acceptUrl}\nTừ chối: ${data.declineUrl}`,
  }
}

export function createAssistantShiftTransferRequestTemplate(data: AssistantShiftTransferTemplateData): {
  subject: string
  html: string
  text: string
} {
  const subject = `${data.requesterName} muốn nhường ca cho bạn`
  const html = wrapEmail(
    'Xác nhận nhận ca trợ giảng',
    `
      <p>Xin chào <strong>${escapeHtml(data.recipientName)}</strong>,</p>
      <p><strong>${escapeHtml(data.requesterName)}</strong> muốn nhường cho bạn ca sau:</p>
      ${shiftDetail(data.shiftName, data.startAt, data.endAt)}
      ${actionButtons(data.acceptUrl, data.declineUrl)}
      ${actionFallbackLinks(data.acceptUrl, data.declineUrl)}
      <p style="font-size:13px;color:#667085">Liên kết chỉ dùng được khi assignment đang chờ và ca chưa kết thúc.</p>`,
  )

  return {
    subject,
    html,
    text: `${data.requesterName} muốn nhường ca cho bạn. Xác nhận: ${data.acceptUrl}\nTừ chối: ${data.declineUrl}`,
  }
}

export function createAssistantShiftRequestAcceptedTemplate(
  data: AssistantShiftExchangeTemplateBase & {
    action: 'swap' | 'transfer'
    recipientRole: 'requester' | 'recipient'
  },
): { subject: string; html: string; text: string } {
  const isSwap = data.action === 'swap'
  const subject = `${isSwap ? 'Đổi ca' : 'Nhường ca'} trợ giảng thành công`
  const message = isSwap
    ? `Bạn và <strong>${escapeHtml(data.requesterName)}</strong> đã xác nhận đổi ca thành công.`
    : data.recipientRole === 'requester'
      ? `<strong>${escapeHtml(data.requesterName)}</strong> đã xác nhận nhận ca. Bạn đã nhường ca thành công.`
      : `Bạn đã xác nhận nhận ca từ <strong>${escapeHtml(data.requesterName)}</strong> thành công.`
  const detailLabel = isSwap || data.recipientRole === 'recipient' ? 'Ca được phân công cho bạn:' : 'Ca bạn đã nhường:'
  const html = wrapEmail(
    `${isSwap ? 'Đổi ca' : 'Nhường ca'} trợ giảng thành công`,
    `
      <p>Xin chào <strong>${escapeHtml(data.recipientName)}</strong>,</p>
      <p>${message}</p>
      <p>${detailLabel}</p>
      ${shiftDetail(data.shiftName, data.startAt, data.endAt)}`,
  )

  return {
    subject,
    html,
    text: `Xin chào ${data.recipientName},\n\n${isSwap ? `Bạn và ${data.requesterName} đã xác nhận đổi ca thành công.` : data.recipientRole === 'requester' ? `${data.requesterName} đã xác nhận nhận ca. Bạn đã nhường ca thành công.` : `Bạn đã xác nhận nhận ca từ ${data.requesterName} thành công.`}\n${detailLabel} ${data.shiftName} (${formatDateTime(data.startAt)} - ${formatDateTime(data.endAt)})`,
  }
}

export function createAssistantShiftRequestDeclinedTemplate(
  data: AssistantShiftExchangeTemplateBase & { action: 'đổi ca' | 'nhường ca' },
): { subject: string; html: string; text: string } {
  const subject = `Đề nghị ${data.action} đã bị từ chối`
  const html = wrapEmail(
    `Đề nghị ${data.action} đã bị từ chối`,
    `
      <p>Xin chào <strong>${escapeHtml(data.recipientName)}</strong>,</p>
      <p><strong>${escapeHtml(data.requesterName)}</strong> đã từ chối đề nghị ${data.action} của bạn.</p>
      ${shiftDetail(data.shiftName, data.startAt, data.endAt)}`,
  )

  return {
    subject,
    html,
    text: `${data.requesterName} đã từ chối đề nghị ${data.action} của bạn cho ca ${data.shiftName}.`,
  }
}
