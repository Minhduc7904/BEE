export class SepayTransactionSyncCursor {
  sepayTransactionSyncCursorId: number
  scope: string
  createdAt: Date
  updatedAt: Date
  lastSinceId?: string | null
  lastSyncedAt?: Date | null
  lastErrorAt?: Date | null
  lastErrorMessage?: string | null

  constructor(data: {
    sepayTransactionSyncCursorId: number
    scope: string
    createdAt: Date
    updatedAt: Date
    lastSinceId?: string | null
    lastSyncedAt?: Date | null
    lastErrorAt?: Date | null
    lastErrorMessage?: string | null
  }) {
    this.sepayTransactionSyncCursorId = data.sepayTransactionSyncCursorId
    this.scope = data.scope
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.lastSinceId = data.lastSinceId
    this.lastSyncedAt = data.lastSyncedAt
    this.lastErrorAt = data.lastErrorAt
    this.lastErrorMessage = data.lastErrorMessage
  }

  hasCheckpoint(): boolean {
    return Boolean(this.lastSinceId)
  }
}
