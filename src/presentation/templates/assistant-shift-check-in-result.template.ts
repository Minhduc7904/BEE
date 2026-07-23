export interface AssistantShiftCheckInResultPageData {
  success: boolean
  message: string
}

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

export function renderAssistantShiftCheckInResultPage(data: AssistantShiftCheckInResultPageData): string {
  const color = data.success ? '#16a34a' : '#dc2626'
  const title = data.success ? 'Điểm danh thành công' : 'Điểm danh không thành công'
  const icon = data.success
    ? '<path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/>'
    : '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6m0-6 6 6"/>'

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a}.card{width:min(440px,calc(100% - 40px));box-sizing:border-box;padding:42px 32px;text-align:center;background:#fff;border-radius:20px;box-shadow:0 18px 50px #0f172a18}.icon{width:82px;height:82px;margin:auto;color:${color};display:block}h1{margin:22px 0 12px;font-size:25px}p{margin:0;color:#475569;font-size:16px;line-height:1.6}.hint{margin-top:24px;font-size:13px;color:#94a3b8}</style></head>
<body><main class="card"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg><h1>${title}</h1><p>${escapeHtml(data.message)}</p><div class="hint">Bee Education</div></main></body></html>`
}
