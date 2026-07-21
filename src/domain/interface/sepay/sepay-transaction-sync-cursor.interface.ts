export interface CreateSepayTransactionSyncCursorData {
  scope: string
  lastSinceId?: string | null
  lastSyncedAt?: Date | null
  lastErrorAt?: Date | null
  lastErrorMessage?: string | null
}

export interface UpdateSepayTransactionSyncCursorData {
  lastSinceId?: string | null
  lastSyncedAt?: Date | null
  lastErrorAt?: Date | null
  lastErrorMessage?: string | null
}

export interface SepayTransactionSyncCursorListOptions {
  skip?: number
  take?: number
  search?: string
  sortBy?: 'sepayTransactionSyncCursorId' | 'scope' | 'lastSyncedAt' | 'lastErrorAt' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}
