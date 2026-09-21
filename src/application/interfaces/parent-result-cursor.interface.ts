export interface ParentResultCursor {
  timestamp: Date
  id: number
}

const CURSOR_PATTERN = /^(\d+)_(\d+)$/

export function encodeResultCursor(timestamp: Date, id: number): string {
  return `${timestamp.getTime()}_${id}`
}

export function decodeResultCursor(raw: string): ParentResultCursor | null {
  const match = CURSOR_PATTERN.exec(raw)
  if (!match) return null
  return { timestamp: new Date(Number(match[1])), id: Number(match[2]) }
}
